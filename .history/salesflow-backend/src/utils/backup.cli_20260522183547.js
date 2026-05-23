#!/usr/bin/env node

/**
 * Backup CLI - Command-line tool for database backups
 * 
 * Usage:
 *   npm run backup                    # Create full backup
 *   npm run backup list               # List all backups
 *   npm run backup clean              # Delete old backups
 *   npm run backup export <name>      # Export backup as zip
 */

require('dotenv').config();
const mongoose = require('mongoose');
const backupService = require('../services/backup.service');
const { connectDB } = require('../config/db');

const command = process.argv[2];

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected\n');

    if (command === 'list') {
      await handleList();
    } else if (command === 'clean') {
      await handleClean();
    } else if (command === 'export') {
      await handleExport();
    } else {
      // Default: create backup
      await handleCreate();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function handleCreate() {
  console.log('🚀 Creating full backup...\n');
  const manifest = await backupService.createFullBackup();
  console.log('\n📋 Backup Manifest:');
  console.log(JSON.stringify(manifest, null, 2));
}

async function handleList() {
  console.log('📋 Available Backups:\n');
  const backups = await backupService.listBackups();

  if (backups.length === 0) {
    console.log('No backups found');
    return;
  }

  backups.forEach((backup, index) => {
    const date = new Date(backup.timestamp);
    console.log(`${index + 1}. ${backup.backupName}`);
    console.log(`   🆔 ID: ${backup.backupId}`);
    console.log(`   📅 Date: ${date.toLocaleString()}`);
    console.log(`   📊 Collections: ${Object.keys(backup.database.collections).join(', ')}`);
    console.log('');
  });

  console.log(`Total: ${backups.length} backups`);
}

async function handleClean() {
  const keepCount = parseInt(process.argv[3] || 5);
  console.log(`🧹 Cleaning old backups (keeping last ${keepCount})...\n`);
  await backupService.deleteOldBackups(keepCount);
}

async function handleExport() {
  const backupName = process.argv[3];

  if (!backupName) {
    console.error('❌ Please provide backup name to export');
    console.error('Usage: npm run backup export <backup-name>');
    process.exit(1);
  }

  const outputPath = `${backupName}.zip`;
  console.log(`📦 Exporting backup to ${outputPath}...\n`);
  await backupService.exportBackupArchive(backupName, outputPath);
}

// Show help if needed
if (process.argv[2] === 'help' || process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║               FairDirection Backup CLI                         ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  npm run backup                      Create a new full backup
  npm run backup list                 List all available backups
  npm run backup clean [keep-count]   Clean old backups (default: keep 5)
  npm run backup export <name>        Export backup as zip archive
  npm run backup help                 Show this help message

EXAMPLES:
  npm run backup                      # Create backup right now
  npm run backup list                 # See all backups
  npm run backup clean 10             # Keep last 10 backups
  npm run backup export backup-2026-05-22

NOTES:
  - Backups are stored in: ./backups/
  - Database exports are in: ./backups/database/
  - File backups are in: ./backups/files/
  - Manifests are in: ./backups/*-manifest.json
  
SCHEDULING:
  Set these environment variables to customize scheduling:
  - BACKUP_SCHEDULE="0 2 * * *"       (default: daily at 2 AM)
  - BACKUP_CLEANUP="0 3 * * 0"        (default: Sunday at 3 AM)
  - BACKUP_KEEP_COUNT="5"             (default: keep last 5)

For cron patterns, visit: https://crontab.guru/
  `);
  process.exit(0);
}

main();
