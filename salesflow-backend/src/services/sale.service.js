const Sale = require('../models/sale.model');
const Claim = require('../models/claim.model');
const Client = require('../models/client.model');
const Employee = require('../models/employee.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId } = require('../utils/quarter.utils');
const { calculateCommission, calculateSellerCommissions } = require('../utils/commission.utils');
const { paginate } = require('../utils/pagination.utils');
const { runInTransaction } = require('../utils/transaction.utils');
const { clearDashboardCache } = require('./dashboard.service');

const generateClaimForSale = async (sale, session) => {
  const existing = await Claim.findOne({ saleId: sale._id, isActive: true }).session(session);
  if (!existing) {
    const claimNumber = await generateCode(Claim, 'claimNumber', 'CLM');
    
    const claimData = {
      saleId: sale._id,
      claimNumber,
      saleNumber:   sale.saleNumber,
      projectName:  sale.projectName,
      unitNumber:   sale.unitNumber,
      clientName:   sale.clientName,
      commissionDue: sale.invoiceAmount,
      invoiceStatus: sale.invoiceStatus,
      expectedCollectionDate: sale.expectedCollectionDate,
      status: 'pending'
    };

    if (session) {
      await Claim.create([claimData], { session });
    } else {
      await Claim.create(claimData);
    }

    sale.status = 'claimed';
    await sale.save({ session });
  }
};

const createSale = async (data) => {
  return await runInTransaction(async (session) => {
    // 1. Generate code & Detect quarter
    const saleNumber = await generateCode(Sale, 'saleNumber', 'SALE');
    const quarterId = getQuarterId(new Date(data.contractDate));

    // 2. Fetch dependencies for denormalization
    const client = await Client.findById(data.clientId).session(session);
    if (!client) throw new Error('Client not found');

    // 3. Calculate full commission chain
    const commissionResults = calculateCommission({
      unitValue: data.unitValue,
      contractCommissionPercentage: data.contractCommissionPercentage,
      developerCollectionPercentage: data.developerCollectionPercentage
    });

    // 4. Calculate seller shares
    const sellersWithDetails = await Promise.all(data.sellers.map(async (s) => {
      const emp = await Employee.findById(s.employeeId).session(session);
      if (!emp) throw new Error(`Employee ${s.employeeId} not found`);
      return {
        ...s,
        employeeName: emp.name
      };
    }));

    const finalSellers = calculateSellerCommissions(sellersWithDetails, commissionResults.grossCommissionWithVAT);

    // 5. Create sale
    let sale;
    if (session) {
      const [created] = await Sale.create([{
        ...data,
        ...commissionResults,
        saleNumber,
        quarterId,
        clientName: client.name,
        sellers: finalSellers
      }], { session });
      sale = created;
    } else {
      sale = await Sale.create({
        ...data,
        ...commissionResults,
        saleNumber,
        quarterId,
        clientName: client.name,
        sellers: finalSellers
      });
    }

    // Auto-generate claim if sale status is created as 'confirmed'
    if (sale.status === 'confirmed') {
      await generateClaimForSale(sale, session);
    }

    clearDashboardCache();
    return sale;
  });
};

const getSales = async (query) => {
  const { search, status, quarterId, clientId, employeeId, page, limit, sortBy, order } = query;
  
  const filter = { isActive: true };
  if (status) filter.status = status;
  if (quarterId) filter.quarterId = quarterId;
  if (clientId) filter.clientId = clientId;
  if (employeeId) filter['sellers.employeeId'] = employeeId;
  
  if (search) {
    filter.$or = [
      { saleNumber: { $regex: search, $options: 'i' } },
      { projectName: { $regex: search, $options: 'i' } },
      { clientName: { $regex: search, $options: 'i' } },
      { unitNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = order === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  return await paginate(Sale, filter, { 
    page, 
    limit, 
    sort, 
    populate: 'clientId sellers.employeeId',
    select: 'saleNumber contractDate projectName clientName clientId unitNumber unitType unitValue grossCommissionWithVAT invoiceAmount invoiceStatus expectedCollectionDate status sellers quarterId'
  });
};

const getSaleById = async (id) => {
  return await Sale.findById(id).populate('clientId sellers.employeeId');
};

const updateSale = async (id, data) => {
  return await runInTransaction(async (session) => {
    const sale = await Sale.findById(id).session(session);
    if (!sale) throw new Error('Sale not found');

    // If financial inputs changed, recalculate
    if (data.unitValue || data.contractCommissionPercentage || data.developerCollectionPercentage || data.contractDate || data.sellers) {
      
      const unitValue = data.unitValue || sale.unitValue;
      const contractCommissionPercentage = data.contractCommissionPercentage || sale.contractCommissionPercentage;
      const developerCollectionPercentage = data.developerCollectionPercentage || sale.developerCollectionPercentage;
      
      const commissionResults = calculateCommission({
        unitValue,
        contractCommissionPercentage,
        developerCollectionPercentage
      });
      
      Object.assign(data, commissionResults);

      if (data.contractDate) {
        data.quarterId = getQuarterId(new Date(data.contractDate));
      }

      if (data.sellers) {
        const sellersWithDetails = await Promise.all(data.sellers.map(async (s) => {
          const emp = await Employee.findById(s.employeeId).session(session);
          return { ...s, employeeName: emp ? emp.name : 'Unknown' };
        }));
        data.sellers = calculateSellerCommissions(sellersWithDetails, commissionResults.grossCommissionWithVAT);
      } else {
        // Recalculate existing sellers with new gross commission
        data.sellers = calculateSellerCommissions(sale.sellers, commissionResults.grossCommissionWithVAT);
      }
    }

    if (data.clientId) {
      const client = await Client.findById(data.clientId).session(session);
      if (client) data.clientName = client.name;
    }

    clearDashboardCache();
    const updatedSale = await Sale.findByIdAndUpdate(id, data, { session, new: true }).populate('clientId sellers.employeeId');

    if (data.status === 'confirmed' || (sale.status === 'draft' && data.status === 'confirmed')) {
      await generateClaimForSale(updatedSale, session);
      return await Sale.findById(id).session(session).populate('clientId sellers.employeeId');
    }

    return updatedSale;
  });
};

const deleteSale = async (id) => {
  return await runInTransaction(async (session) => {
    clearDashboardCache();
    return await Sale.findByIdAndUpdate(id, { isActive: false }, { session, new: true });
  });
};

const confirmSale = async (id) => {
  return await runInTransaction(async (session) => {
    const sale = await Sale.findById(id).session(session);
    if (!sale) throw new Error('Sale not found');
    
    const sum = sale.sellers.reduce((acc, s) => acc + s.sharePercentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      const err = new Error('Sellers share percentages must sum to 100');
      err.status = 400;
      throw err;
    }
    
    // 1. Mark sale as confirmed
    sale.status = 'confirmed';
    await sale.save({ session });

    // 2. Automatically generate the Claim in the background
    await generateClaimForSale(sale, session);
    
    clearDashboardCache();
    return sale;
  });
};

const getCommissionPreview = async (id, query) => {
  const sale = await Sale.findById(id).populate('sellers.employeeId');
  if (!sale) throw new Error('Sale not found');

  const unitValue = Number(query.unitValue) || sale.unitValue;
  const contractCommissionPercentage = Number(query.contractCommissionPercentage) || sale.contractCommissionPercentage;
  const developerCollectionPercentage = Number(query.developerCollectionPercentage) || sale.developerCollectionPercentage;

  const commissionResults = calculateCommission({
    unitValue,
    contractCommissionPercentage,
    developerCollectionPercentage
  });

  const sellersWithDetails = sale.sellers.map(s => ({
    employeeId: s.employeeId ? s.employeeId._id : s.employeeId,
    employeeName: s.employeeId ? s.employeeId.name : 'Unknown',
    sharePercentage: s.sharePercentage
  }));

  const finalSellers = calculateSellerCommissions(sellersWithDetails, commissionResults.grossCommissionWithVAT);

  return {
    ...commissionResults,
    sellers: finalSellers
  };
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  confirmSale,
  getCommissionPreview
};
