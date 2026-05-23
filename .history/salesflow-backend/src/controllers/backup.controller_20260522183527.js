const backupService = require('../services/backup.service');
const path = require('path');

/**
 * Create a manual backup
 * POST /api/v1/backups/manual
 */
const createManualBackup = async (req, res) => {
  try {
    console.log('🔵 Creating manual backup...');
    const manifest = await backupService.createFullBackup();
    
    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      backup: manifest
    });
  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

/**
 * List all backups
 * GET /api/v1/backups
 */
const getBackups = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.status(200).json({
      success: true,
      backups,
      count: backups.length
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
};

/**
 * Download backup as archive
 * GET /api/v1/backups/:backupName/download
 */
const downloadBackup = async (req, res) => {
  try {
    const { backupName } = req.params;
    const outputPath = path.join(backupService.BACKUP_DIR, `${backupName}.zip`);

    await backupService.exportBackupArchive(backupName, outputPath);

    res.download(outputPath, `${backupName}.zip`, (err) => {
      if (err) {
        console.error('Error downloading backup:', err);
      }
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message
    });
  }
};

/**
 * Delete old backups
 * DELETE /api/v1/backups/cleanup
 */
const cleanupOldBackups = async (req, res) => {
  try {
    const { keepCount = 5 } = req.body;
    
    await backupService.deleteOldBackups(keepCount);

    res.status(200).json({
      success: true,
      message: `Cleanup completed. Keeping last ${keepCount} backups.`
    });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup backups',
      error: error.message
    });
  }
};

/**
 * Get backup info
 * GET /api/v1/backups/:backupName
 */
const getBackupInfo = async (req, res) => {
  try {
    const { backupName } = req.params;
    const backups = await backupService.listBackups();
    const backup = backups.find(b => b.backupName === backupName);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    res.status(200).json({
      success: true,
      backup
    });
  } catch (error) {
    console.error('Error getting backup info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup info',
      error: error.message
    });
  }
};

module.exports = {
  createManualBackup,
  getBackups,
  downloadBackup,
  cleanupOldBackups,
  getBackupInfo
};
