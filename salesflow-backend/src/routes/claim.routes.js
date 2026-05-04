const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { createClaimSchema, updateClaimSchema } = require('../validators/claim.validator');
const {
  getClaims,
  getClaim,
  createClaim,
  updateClaim,
  deleteClaim,
  collectClaim,
  updateClaimStatus
} = require('../controllers/claim.controller');

router.get('/',      getClaims);
router.get('/:id',   getClaim);
router.post('/',     validate(createClaimSchema), createClaim);
router.patch('/:id/collect', collectClaim);
router.patch('/:id/status', updateClaimStatus);
router.patch('/:id', validate(updateClaimSchema), updateClaim);
router.delete('/:id', deleteClaim);

module.exports = router;
