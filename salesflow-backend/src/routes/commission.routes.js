const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/auth.middleware');
const {
  getSalespersonCommission,
  simulateCommission,
  triggerQuarterlySettlement,
  getPayoutSchedule,
  updatePayoutStatus
} = require('../controllers/commission.controller');

// Commission details per employee (any authenticated user)
router.get('/salesperson/:id', getSalespersonCommission);

// Simulation dry-run (any authenticated user)
router.get('/simulate', simulateCommission);
router.post('/simulate', simulateCommission);

// Payout schedule (any authenticated user); status update is admin-only
router.get('/payouts/schedule', getPayoutSchedule);
router.patch('/payouts/:id/status', adminMiddleware, updatePayoutStatus);

// Quarterly settlement trigger is admin-only
router.post('/settlement/:quarter/:year', adminMiddleware, triggerQuarterlySettlement);

module.exports = router;
