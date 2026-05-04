const express = require('express');
const router = express.Router();
const {
  getEmployeeTarget,
  getTeamTarget,
  getTargetSummary
} = require('../controllers/target.controller');

router.get('/employee/:id', getEmployeeTarget);
router.get('/team/:id', getTeamTarget);
router.get('/summary', getTargetSummary);

module.exports = router;
