const Sale = require('../models/sale.model');
const Client = require('../models/client.model');
const Employee = require('../models/employee.model');
const { generateCode } = require('../utils/code-generator');
const { getQuarterId } = require('../utils/quarter.utils');
const { calculateCommission, calculateSellerCommissions } = require('../utils/commission.utils');
const { paginate } = require('../utils/pagination.utils');

const createSale = async (data) => {
  // 1. Generate code & Detect quarter
  const saleNumber = await generateCode(Sale, 'saleNumber', 'SALE');
  const quarterId = getQuarterId(new Date(data.contractDate));

  // 2. Fetch dependencies for denormalization
  const client = await Client.findById(data.clientId);
  if (!client) throw new Error('Client not found');

  // 3. Calculate full commission chain
  const commissionResults = calculateCommission({
    unitValue: data.unitValue,
    contractCommissionPercentage: data.contractCommissionPercentage,
    developerCollectionPercentage: data.developerCollectionPercentage
  });

  // 4. Calculate seller shares
  const sellersWithDetails = await Promise.all(data.sellers.map(async (s) => {
    const emp = await Employee.findById(s.employeeId);
    if (!emp) throw new Error(`Employee ${s.employeeId} not found`);
    return {
      ...s,
      employeeName: emp.name
    };
  }));

  const finalSellers = calculateSellerCommissions(sellersWithDetails, commissionResults.grossCommissionWithVAT);

  // 5. Create sale
  const sale = await Sale.create({
    ...data,
    ...commissionResults,
    saleNumber,
    quarterId,
    clientName: client.name,
    sellers: finalSellers
  });

  return sale;
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

  return await paginate(Sale, filter, { page, limit, sort, populate: 'clientId sellers.employeeId' });
};

const getSaleById = async (id) => {
  return await Sale.findById(id).populate('clientId sellers.employeeId');
};

const updateSale = async (id, data) => {
  const sale = await Sale.findById(id);
  if (!sale) throw new Error('Sale not found');

  // If status changed to collected, logic might differ (handled via Claim service usually)
  
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
        const emp = await Employee.findById(s.employeeId);
        return { ...s, employeeName: emp ? emp.name : 'Unknown' };
      }));
      data.sellers = calculateSellerCommissions(sellersWithDetails, commissionResults.grossCommissionWithVAT);
    } else {
      // Recalculate existing sellers with new gross commission
      data.sellers = calculateSellerCommissions(sale.sellers, commissionResults.grossCommissionWithVAT);
    }
  }

  if (data.clientId) {
    const client = await Client.findById(data.clientId);
    if (client) data.clientName = client.name;
  }

  return await Sale.findByIdAndUpdate(id, data, { returnDocument: 'after' }).populate('clientId sellers.employeeId');
};

const deleteSale = async (id) => {
  return await Sale.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
};

const confirmSale = async (id) => {
  const sale = await Sale.findById(id);
  if (!sale) throw new Error('Sale not found');
  
  const sum = sale.sellers.reduce((acc, s) => acc + s.sharePercentage, 0);
  if (Math.abs(sum - 100) > 0.01) {
    const err = new Error('Sellers share percentages must sum to 100');
    err.status = 400;
    throw err;
  }
  
  sale.status = 'confirmed';
  await sale.save();
  return sale;
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
