const Claim = require('../models/claim.model');
const Sale = require('../models/sale.model');
const { generateCode } = require('../utils/code-generator');
const { paginate } = require('../utils/pagination.utils');

const createClaim = async (data) => {
  const sale = await Sale.findById(data.saleId);
  if (!sale) throw new Error('Sale not found');
  if (sale.status === 'draft') throw new Error('Cannot claim a draft sale');

  // Check if claim already exists
  const existing = await Claim.findOne({ saleId: data.saleId, isActive: true });
  if (existing) throw new Error('Claim already exists for this sale');

  const claimNumber = await generateCode(Claim, 'claimNumber', 'CLM');

  const claim = await Claim.create({
    ...data,
    claimNumber,
    saleNumber:   sale.saleNumber,
    projectName:  sale.projectName,
    unitNumber:   sale.unitNumber,
    clientName:   sale.clientName,
    commissionDue: sale.invoiceAmount,
    invoiceStatus: sale.invoiceStatus,
    expectedCollectionDate: sale.expectedCollectionDate
  });

  // Update sale status
  await Sale.findByIdAndUpdate(data.saleId, { status: 'claimed' });

  return claim;
};

const getClaims = async (query) => {
  const { search, status, page, limit } = query;
  const filter = { isActive: true };
  if (status) filter.status = status;
  
  if (search) {
    filter.$or = [
      { claimNumber: { $regex: search, $options: 'i' } },
      { saleNumber: { $regex: search, $options: 'i' } },
      { projectName: { $regex: search, $options: 'i' } },
      { clientName: { $regex: search, $options: 'i' } }
    ];
  }

  return await paginate(Claim, filter, { page, limit, populate: 'saleId' });
};

const getClaimById = async (id) => {
  return await Claim.findById(id).populate('saleId');
};

const updateClaim = async (id, data) => {
  const claim = await Claim.findById(id);
  if (!claim) throw new Error('Claim not found');

  const updatedClaim = await Claim.findByIdAndUpdate(id, data, { returnDocument: 'after' });

  if (data.status === 'collected') {
    await Sale.findByIdAndUpdate(claim.saleId, { status: 'collected' });
  }

  return updatedClaim;
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
  const claim = await Claim.findById(id);
  if (claim) {
    // Revert sale status if claim is deleted? 
    // Business rule: "Soft delete only".
    await Sale.findByIdAndUpdate(claim.saleId, { status: 'confirmed' });
  }
  return await Claim.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
};

module.exports = {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  deleteClaim,
  collectClaim,
  updateClaimStatus
};
