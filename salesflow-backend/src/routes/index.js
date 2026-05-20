const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

router.use('/auth',      require('./auth.routes'));
router.use('/employees', authMiddleware, require('./employee.routes'));
router.use('/teams',     authMiddleware, require('./team.routes'));
router.use('/settings',  authMiddleware, require('./setting.routes'));
router.use('/clients',   authMiddleware, require('./client.routes'));
router.use('/sales',     authMiddleware, require('./sale.routes'));
router.use('/claims',    authMiddleware, require('./claim.routes'));
router.use('/dashboard', authMiddleware, require('./dashboard.routes'));
router.use('/targets',   authMiddleware, require('./target.routes'));
router.use('/commissions', authMiddleware, require('./commission.routes'));

module.exports = router;
