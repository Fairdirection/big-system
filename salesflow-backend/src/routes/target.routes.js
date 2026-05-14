const express = require('express');
const router = express.Router();
const {
  getQuarterlyOverrides,
  getEmployeeTarget,
  getTeamTarget,
  getTargetSummary,
  updateQuarterlyTarget
} = require('../controllers/target.controller');

router.get('/overrides', getQuarterlyOverrides);
router.get('/employee/:id', getEmployeeTarget);
router.get('/team/:id', getTeamTarget);
router.get('/summary', getTargetSummary);
router.put('/employee/:id', updateQuarterlyTarget);

module.exports = router;
