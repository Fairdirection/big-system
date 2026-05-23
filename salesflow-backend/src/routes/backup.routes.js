const express = require("express");
const backupController = require("../controllers/backup.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * Backup Routes
 * All routes require authentication
 */

// Create manual backup
router.post("/manual", authMiddleware, backupController.createManualBackup);

// Get all backups
router.get("/", authMiddleware, backupController.getBackups);

// Cleanup old backups — must be before /:backupName to avoid route collision
router.delete("/cleanup", authMiddleware, backupController.cleanupOldBackups);

// Delete specific backup
router.delete("/:backupName", authMiddleware, backupController.deleteBackup);

// Download backup as archive
router.get(
  "/:backupName/download",
  authMiddleware,
  backupController.downloadBackup,
);

// Get specific backup info
router.get("/:backupName", authMiddleware, backupController.getBackupInfo);

module.exports = router;
