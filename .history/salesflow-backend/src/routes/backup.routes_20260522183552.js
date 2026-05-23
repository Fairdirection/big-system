const express = require('express');
const backupController = require('../controllers/backup.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Backup Routes
 * All routes require authentication
 */

// Create manual backup
router.post('/manual', authMiddleware, backupController.createManualBackup);

// Get all backups
router.get('/', authMiddleware, backupController.getBackups);

// Get specific backup info
router.get('/:backupName', authMiddleware, backupController.getBackupInfo);

// Download backup as archive
router.get('/:backupName/download', authMiddleware, backupController.downloadBackup);

// Cleanup old backups
router.delete('/cleanup', authMiddleware, backupController.cleanupOldBackups);

module.exports = router;
