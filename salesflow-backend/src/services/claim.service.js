const Claim = require('../models/claim.model');
const Sale = require('../models/sale.model');
const { generateCode } = require('../utils/code-generator');
const { paginate } = require('../utils/pagination.utils');
const { runInTransaction } = require('../utils/transaction.utils');
const { clearDashboardCache } = require('./dashboard.service');

const createClaim = async (data) => {
  return await runInTransaction(async (session) => {
    const sale = await Sale.findById(data.saleId).session(session);
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'draft') throw new Error('Cannot claim a draft sale');

    // Check if claim already exists (active or inactive)
    const existing = await Claim.findOne({ saleId: data.saleId }).session(session);
    if (existing) {
      if (existing.isActive) {
        throw new Error('Claim already exists for this sale');
      } else {
        // Reactivate soft-deleted claim to satisfy database unique index!
        existing.isActive = true;
        existing.status = 'pending';
        existing.saleNumber = sale.saleNumber;
        existing.projectName = sale.projectName;
        existing.unitNumber = sale.unitNumber;
        existing.clientName = sale.clientName;
        existing.commissionDue = sale.invoiceAmount;
        existing.invoiceStatus = sale.invoiceStatus;
        existing.expectedCollectionDate = sale.expectedCollectionDate;
        if (data.notes) existing.notes = data.notes;
        
        await existing.save({ session });
        await Sale.findByIdAndUpdate(data.saleId, { status: 'claimed' }, { session });
        clearDashboardCache();
        return existing;
      }
    }

    const claimNumber = await generateCode(Claim, 'claimNumber', 'CLM');

    let claim;
    const claimData = {
      ...data,
      claimNumber,
      saleNumber:   sale.saleNumber,
      projectName:  sale.projectName,
      unitNumber:   sale.unitNumber,
      clientName:   sale.clientName,
      quarterId:    sale.quarterId,
      commissionDue: sale.invoiceAmount,
      invoiceStatus: sale.invoiceStatus,
      expectedCollectionDate: sale.expectedCollectionDate
    };

    if (session) {
      const [created] = await Claim.create([claimData], { session });
      claim = created;
    } else {
      claim = await Claim.create(claimData);
    }

    // Update sale status
    await Sale.findByIdAndUpdate(data.saleId, { status: 'claimed' }, { session });

    clearDashboardCache();
    return claim;
  });
};

const getClaims = async (query) => {
  const { search, status, quarterId, page, limit } = query;
  const filter = { isActive: true };
  if (status) filter.status = status;
  if (quarterId) filter.quarterId = quarterId;
  
  if (search) {
    filter.$or = [
      { claimNumber: { $regex: search, $options: 'i' } },
      { saleNumber: { $regex: search, $options: 'i' } },
      { projectName: { $regex: search, $options: 'i' } },
      { clientName: { $regex: search, $options: 'i' } }
    ];
  }

  return await paginate(Claim, filter, { 
    page, 
    limit, 
    populate: 'saleId',
    select: 'claimNumber saleNumber projectName clientName commissionDue collectedAmount collectionDate status expectedCollectionDate notes saleId'
  });
};

const getClaimById = async (id) => {
  return await Claim.findById(id).populate('saleId');
};

const commissionService = require('./commission.service');

const updateClaim = async (id, data) => {
  return await runInTransaction(async (session) => {
    const claim = await Claim.findById(id).session(session);
    if (!claim) throw new Error('Claim not found');

    const updatedClaim = await Claim.findByIdAndUpdate(id, data, { session, new: true });

    if (data.status === 'collected') {
      await Sale.findByIdAndUpdate(claim.saleId, { status: 'collected' }, { session });
      // Generate monthly minimum payouts for salespersons
      await commissionService.recordSaleCommissionPayouts(claim.saleId);
    } else if (data.status && data.status !== 'collected') {
      await Sale.findByIdAndUpdate(claim.saleId, { status: 'claimed' }, { session });
    }

    clearDashboardCache();
    return updatedClaim;
  });
};

const collectClaim = async (id, data) => {
  if (!data.collectionDate || !data.collectedAmount) {
    throw new Error('collectionDate and collectedAmount are required');
  }
  return await updateClaim(id, { 
    ...data, 
    status: 'collected' 
  });
};

const updateClaimStatus = async (id, data) => {
  return await updateClaim(id, { 
    status: data.status,
    notes: data.notes
  });
};

const deleteClaim = async (id) => {
  return await runInTransaction(async (session) => {
    const claim = await Claim.findById(id).session(session);
    if (claim) {
      // Revert sale status if claim is deleted? 
      // Business rule: "Soft delete only".
      await Sale.findByIdAndUpdate(claim.saleId, { status: 'confirmed' }, { session });
    }
    clearDashboardCache();
    return await Claim.findByIdAndUpdate(id, { isActive: false }, { session, new: true });
  });
};

const syncClaims = async () => {
  return await runInTransaction(async (session) => {
    const confirmedSales = await Sale.find({ status: 'confirmed', isActive: true }).session(session);
    const createdClaims = [];

    for (const sale of confirmedSales) {
      // Check for any existing claim (active or soft-deleted)
      const existing = await Claim.findOne({ saleId: sale._id }).session(session);
      
      if (existing) {
        if (!existing.isActive) {
          // Reactivate the soft-deleted claim to respect the MongoDB unique index constraint
          existing.isActive = true;
          existing.status = 'pending';
          existing.saleNumber = sale.saleNumber;
          existing.projectName = sale.projectName;
          existing.unitNumber = sale.unitNumber;
          existing.clientName = sale.clientName;
          existing.commissionDue = sale.invoiceAmount;
          existing.invoiceStatus = sale.invoiceStatus;
          existing.expectedCollectionDate = sale.expectedCollectionDate;
          
          await existing.save({ session });
          await Sale.findByIdAndUpdate(sale._id, { status: 'claimed' }, { session });
          createdClaims.push(existing);
        }
        // If it's already active, skip it!
      } else {
        // Create new claim
        const claimNumber = await generateCode(Claim, 'claimNumber', 'CLM');
        
        let claim;
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
          const [created] = await Claim.create([claimData], { session });
          claim = created;
        } else {
          claim = await Claim.create(claimData);
        }

        await Sale.findByIdAndUpdate(sale._id, { status: 'claimed' }, { session });
        createdClaims.push(claim);
      }
    }

    if (createdClaims.length > 0) {
      clearDashboardCache();
    }
    return createdClaims;
  });
};

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  deleteClaim,
  collectClaim,
  updateClaimStatus,
  syncClaims
};
