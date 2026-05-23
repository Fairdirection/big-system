/**
 * Backup Restoration Script
 * 
 * This script restores a backup into MongoDB
 * Use with caution - it will replace existing data!
 * 
 * Usage: node restore-backup.js <backup-name>
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(__dirname, '../../backups');

async function restoreBackup(backupName) {
  try {
    console.log('\n⚠️  BACKUP RESTORATION INITIATED\n');
    console.log('🔴 WARNING: This will REPLACE all existing data!');
    console.log('   Make sure you have a current backup first.\n');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Find backup
    const backupPath = path.join(BACKUP_DIR, 'database', backupName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }

    // Get manifest
    const manifestPath = path.join(BACKUP_DIR, `${backupName}-manifest.json`);
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Backup manifest not found: ${manifestPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    console.log(`📋 Backup Information:`);
    console.log(`   Name: ${backupName}`);
    console.log(`   Date: ${manifest.timestamp}`);
    console.log(`   Collections: ${Object.keys(manifest.database.collections).join(', ')}\n`);

    // Get MongoDB URI and database name
    const mongoUri = mongoose.connection.getClient().options.url;
    const dbName = mongoose.connection.name;

    // Drop existing database (DANGEROUS!)
    console.log('💀 Dropping existing database...');
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database dropped\n');

    // Restore each collection
    console.log('📥 Restoring collections...');
    const collectionFiles = fs.readdirSync(backupPath).filter(f => f.endsWith('.json'));

    for (const file of collectionFiles) {
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(backupPath, file);

      try {
        console.log(`   Importing: ${collectionName}...`);
        
        // Import collection from JSON
        await execAsync(
          `mongoimport --uri "${mongoUri}" --db "${dbName}" --collection "${collectionName}" --file "${filePath}"`,
          { maxBuffer: 50 * 1024 * 1024 }
        );
        
        console.log(`   ✓ ${collectionName} restored`);
      } catch (err) {
        console.error(`   ❌ Failed to import ${collectionName}: ${err.message}`);
      }
    }

    // Restore files (if available)
    const filesBackupPath = path.join(BACKUP_DIR, 'files', backupName);
    if (fs.existsSync(filesBackupPath)) {
      console.log('\n📁 Restoring files...');
      const uploadsDir = path.join(__dirname, '../../uploads');

      // Clear existing uploads
      if (fs.existsSync(uploadsDir)) {
        console.log('   Clearing existing files...');
        fs.rmSync(uploadsDir, { recursive: true, force: true });
      }

      // Copy restored files
      fs.cpSync(filesBackupPath, uploadsDir, { recursive: true });
      console.log('   ✓ Files restored');
    }

    console.log('\n✅ Restoration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify data in database');
    console.log('   2. Restart the application');
    console.log('   3. Test all functionality');
    console.log('   4. Create a new backup after verification\n');

  } catch (error) {
    console.error('\n❌ Restoration failed:', error.message);
    console.error('\n⚠️  Your database may be in an inconsistent state.');
    console.error('   Please contact support if you need assistance.\n');
  } finally {
    await mongoose.disconnect();
  }
}

// Get backup name from arguments
const backupName = process.argv[2];

if (!backupName) {
  console.error('\n❌ Please provide backup name to restore');
  console.error('\nUsage: node restore-backup.js <backup-name>');
  console.error('\nExample: node restore-backup.js backup-2026-05-22-abc12345');
  console.error('\nTo list available backups, run:');
  console.error('  npm run backup list\n');
  process.exit(1);
}

// Confirm restoration
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  Type "YES" to confirm restoration: ', async (answer) => {
  rl.close();

  if (answer !== 'YES') {
    console.log('\n❌ Restoration cancelled');
    process.exit(1);
  }

  await restoreBackup(backupName);
});
