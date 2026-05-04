const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const { loginSchema, changePasswordSchema } = require('../validators/auth.validator');
const { login, logout, getMe, changePassword } = require('../controllers/auth.controller');

router.post('/login',           validate(loginSchema), login);
router.post('/logout',          logout);
router.get('/me',               authMiddleware, getMe);
router.patch('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);

module.exports = router;
