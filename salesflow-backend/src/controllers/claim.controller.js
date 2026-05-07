const claimService = require('../services/claim.service');
const { sendSuccess } = require('../utils/response.utils');

const createClaim = async (req, res, next) => {
  try {
    const claim = await claimService.createClaim(req.body);
    return sendSuccess(res, claim, 201);
  } catch (error) {
    next(error);
  }
};

const getClaims = async (req, res, next) => {
  try {
    const { data, pagination } = await claimService.getClaims(req.query);
    return sendSuccess(res, data, 200, pagination);
  } catch (error) {
    next(error);
  }
};

const getClaim = async (req, res, next) => {
  try {
    const claim = await claimService.getClaimById(req.params.id);
    if (!claim) {
      const err = new Error('Claim not found');
      err.status = 404;
      throw err;
    }
    return sendSuccess(res, claim);
  } catch (error) {
    next(error);
  }
};

const updateClaim = async (req, res, next) => {
  try {
    const claim = await claimService.updateClaim(req.params.id, req.body);
    return sendSuccess(res, claim);
  } catch (error) {
    next(error);
  }
};

const deleteClaim = async (req, res, next) => {
  try {
    const claim = await claimService.deleteClaim(req.params.id);
    return sendSuccess(res, claim);
  } catch (error) {
    next(error);
  }
};

const collectClaim = async (req, res, next) => {
  try {
    const claim = await claimService.collectClaim(req.params.id, req.body);
    return sendSuccess(res, claim);
  } catch (error) {
    next(error);
  }
};

const updateClaimStatus = async (req, res, next) => {
  try {
    const claim = await claimService.updateClaimStatus(req.params.id, req.body);
    return sendSuccess(res, claim);
  } catch (error) {
    next(error);
  }
};

const syncClaims = async (req, res, next) => {
  try {
    const claims = await claimService.syncClaims();
    return sendSuccess(res, claims, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getClaims,
  getClaim,
  updateClaim,
  deleteClaim,
  collectClaim,
  updateClaimStatus,
  syncClaims
};
