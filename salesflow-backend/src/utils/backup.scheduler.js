const cron = require("node-cron");
const backupService = require("../services/backup.service");

// Backup Scheduler Configuration
//
// Cron patterns:
// - "0 2 * * *"      = Every day at 2:00 AM
// - "0 2 * * 0"      = Every Sunday at 2:00 AM
// - "0 */6 * * *"    = Every 6 hours
// - "0 2 * * MON"    = Every Monday at 2:00 AM
// - "30 1 * * *"     = Every day at 1:30 AM

const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || "0 2 * * *"; // Default: Daily at 2 AM
const CLEANUP_SCHEDULE = process.env.BACKUP_CLEANUP || "0 3 * * 0"; // Default: Weekly (Sunday at 3 AM)
const KEEP_BACKUPS = parseInt(process.env.BACKUP_KEEP_COUNT || "5"); // Keep last 5 backups

let scheduledTasks = [];

/**
 * Initialize scheduled backups
 */
function initBackupScheduler() {
  try {
    console.log("\n📅 Initializing Backup Scheduler...");
    console.log(`   Backup Schedule: ${BACKUP_SCHEDULE}`);
    console.log(`   Cleanup Schedule: ${CLEANUP_SCHEDULE}`);
    console.log(`   Keep Last: ${KEEP_BACKUPS} backups\n`);

    // Automatic daily backup task
    const backupTask = cron.schedule(BACKUP_SCHEDULE, async () => {
      console.log("\n⏰ [SCHEDULED] Running automatic backup...");
      try {
        const manifest = await backupService.createFullBackup();
        console.log("✅ Scheduled backup completed successfully");
      } catch (error) {
        console.error("❌ Scheduled backup failed:", error.message);
      }
    });

    // Automatic cleanup task
    const cleanupTask = cron.schedule(CLEANUP_SCHEDULE, async () => {
      console.log("\n⏰ [SCHEDULED] Running backup cleanup...");
      try {
        await backupService.deleteOldBackups(KEEP_BACKUPS);
        console.log("✅ Scheduled cleanup completed successfully");
      } catch (error) {
        console.error("❌ Scheduled cleanup failed:", error.message);
      }
    });

    scheduledTasks.push(backupTask, cleanupTask);

    console.log("✅ Backup Scheduler initialized and running\n");
  } catch (error) {
    console.error("Error initializing backup scheduler:", error.message);
  }
}

/**
 * Stop all scheduled tasks
 */
function stopBackupScheduler() {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks = [];
  console.log("⛔ Backup Scheduler stopped");
}

/**
 * Validate backup configuration
 */
function validateBackupConfig() {
  try {
    // Validate cron patterns
    cron.validate(BACKUP_SCHEDULE);
    cron.validate(CLEANUP_SCHEDULE);

    console.log("✅ Backup configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Invalid backup configuration:", error.message);
    return false;
  }
}

module.exports = {
  initBackupScheduler,
  stopBackupScheduler,
  validateBackupConfig,
  BACKUP_SCHEDULE,
  CLEANUP_SCHEDULE,
  KEEP_BACKUPS,
};
