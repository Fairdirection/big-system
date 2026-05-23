const fsPromises = require("fs").promises;
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { exec } = require("child_process");
const { promisify } = require("util");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, "../../backups");
const BACKUP_DB_DIR = path.join(BACKUP_DIR, "database");
const BACKUP_FILES_DIR = path.join(BACKUP_DIR, "files");

/**
 * Initialize backup directories
 */
async function initBackupDirs() {
  try {
    await fsPromises.mkdir(BACKUP_DB_DIR, { recursive: true });
    await fsPromises.mkdir(BACKUP_FILES_DIR, { recursive: true });
  } catch (error) {
    console.error("Error initializing backup directories:", error.message);
  }
}

/**
 * Create a full backup (database + files)
 * @returns {Object} Backup metadata
 */
async function createFullBackup() {
  const backupId = uuidv4();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup-${timestamp}-${backupId.substring(0, 8)}`;

  try {
    console.log(`\n📦 Starting full backup: ${backupName}`);

    // 1. Backup database
    console.log("📊 Backing up database...");
    const dbBackupPath = await backupDatabase(backupName);

    // 2. Backup files/photos
    console.log("📸 Backing up files...");
    const filesBackupPath = await backupFiles(backupName);

    // 3. Create manifest
    const manifest = {
      backupId,
      backupName,
      timestamp: new Date().toISOString(),
      database: {
        path: dbBackupPath,
        collections: await getCollectionStats(),
        mongoVersion: await getMongoVersion(),
      },
      files: {
        path: filesBackupPath,
        size: await getDirectorySize(path.join(BACKUP_FILES_DIR, backupName)),
      },
      status: "success",
      environment: process.env.NODE_ENV || "development",
    };

    // 4. Save manifest
    const manifestPath = path.join(BACKUP_DIR, `${backupName}-manifest.json`);
    await fsPromises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`✅ Backup completed: ${backupName}`);
    console.log(`   📍 Location: ${BACKUP_DIR}`);
    console.log(`   🆔 ID: ${backupId}`);

    return manifest;
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Backup MongoDB database
 */
async function backupDatabase(backupName) {
  const backupPath = path.join(BACKUP_DB_DIR, backupName);

  try {
    await fsPromises.mkdir(backupPath, { recursive: true });

    // Get MongoDB URI from mongoose
    const mongoUri = mongoose.connection.getClient().options.url;

    // Use mongoexport for each collection
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    for (const collection of collections) {
      const collectionName = collection.name;
      const exportPath = path.join(backupPath, `${collectionName}.json`);

      // Extract database name from URI
      const dbName = mongoose.connection.name;

      try {
        // Export collection to JSON
        const { stdout, stderr } = await execAsync(
          `mongoexport --uri "${mongoUri}" --db "${dbName}" --collection "${collectionName}" --out "${exportPath}"`,
          { maxBuffer: 50 * 1024 * 1024 },
        );

        console.log(`  ✓ Exported collection: ${collectionName}`);
      } catch (err) {
        console.warn(`  ⚠ Could not export ${collectionName}: ${err.message}`);
      }
    }

    return backupPath;
  } catch (error) {
    console.error(`Error during database backup: ${error.message}`);
    throw error;
  }
}

/**
 * Backup files/photos
 */
async function backupFiles(backupName) {
  const filesSourceDir = path.join(__dirname, "../../uploads");
  const backupPath = path.join(BACKUP_FILES_DIR, backupName);

  try {
    // Check if uploads directory exists
    try {
      await fsPromises.access(filesSourceDir);
    } catch {
      console.log("  ℹ No uploads directory found, creating empty backup");
      await fsPromises.mkdir(backupPath, { recursive: true });
      return backupPath;
    }

    // Create backup directory and copy files
    await fsPromises.mkdir(backupPath, { recursive: true });

    const files = await fsPromises.readdir(filesSourceDir, { recursive: true });
    let copiedCount = 0;

    for (const file of files) {
      const sourcePath = path.join(filesSourceDir, file);
      const destPath = path.join(backupPath, file);

      try {
        const stat = await fsPromises.stat(sourcePath);

        if (stat.isDirectory()) {
          await fsPromises.mkdir(destPath, { recursive: true });
        } else {
          await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
          await fsPromises.copyFile(sourcePath, destPath);
          copiedCount++;
        }
      } catch (err) {
        console.warn(`  ⚠ Could not copy ${file}: ${err.message}`);
      }
    }

    console.log(`  ✓ Backed up ${copiedCount} files`);
    return backupPath;
  } catch (error) {
    console.error(`Error during files backup: ${error.message}`);
    throw error;
  }
}

/**
 * List all available backups
 */
async function listBackups() {
  try {
    await initBackupDirs();

    const files = await fsPromises.readdir(BACKUP_DIR);
    const manifests = files.filter((f) => f.endsWith("-manifest.json"));

    const backups = [];

    for (const manifest of manifests) {
      try {
        const content = await fsPromises.readFile(
          path.join(BACKUP_DIR, manifest),
          "utf-8",
        );
        backups.push(JSON.parse(content));
      } catch (err) {
        console.warn(`Could not read manifest ${manifest}`);
      }
    }

    return backups.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  } catch (error) {
    console.error(`Error listing backups: ${error.message}`);
    throw error;
  }
}

/**
 * Delete old backups (keep last N backups)
 */
async function deleteOldBackups(keepCount = 5) {
  try {
    const backups = await listBackups();

    if (backups.length <= keepCount) {
      console.log(`✓ Only ${backups.length} backups exist, no cleanup needed`);
      return;
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        const dbPath = backup.database.path;
        const filesPath = backup.files.path;
        const manifestPath = path.join(
          BACKUP_DIR,
          `${backup.backupName}-manifest.json`,
        );

        if (dbPath && (await directoryExists(dbPath))) {
          await fsPromises.rm(dbPath, { recursive: true, force: true });
        }

        if (filesPath && (await directoryExists(filesPath))) {
          await fsPromises.rm(filesPath, { recursive: true, force: true });
        }

        await fsPromises.rm(manifestPath, { force: true });

        console.log(`🗑️  Deleted old backup: ${backup.backupName}`);
        deletedCount++;
      } catch (err) {
        console.warn(
          `Could not delete backup ${backup.backupName}: ${err.message}`,
        );
      }
    }

    console.log(`✅ Cleanup complete: Deleted ${deletedCount} old backups`);
  } catch (error) {
    console.error(`Error deleting old backups: ${error.message}`);
  }
}

/**
 * Export backup as compressed archive
 */
async function exportBackupArchive(backupName, outputPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const backupPath = path.join(BACKUP_DIR, "database", backupName);

      // Create output file
      const output = fs.createWriteStream(outputPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(
          `✅ Backup archive created: ${outputPath} (${archive.pointer()} bytes)`,
        );
        resolve(outputPath);
      });

      archive.on("error", reject);
      archive.pipe(output);

      // Add database backup
      archive.directory(path.join(backupPath), "database");

      // Add files backup
      const filesBackupPath = path.join(BACKUP_DIR, "files", backupName);
      if (await directoryExists(filesBackupPath)) {
        archive.directory(filesBackupPath, "files");
      }

      // Add manifest
      const manifestPath = path.join(BACKUP_DIR, `${backupName}-manifest.json`);
      if (await fileExists(manifestPath)) {
        archive.file(manifestPath, { name: "manifest.json" });
      }

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper functions
 */
async function getCollectionStats() {
  try {
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const stats = {};

    for (const collection of collections) {
      const col = mongoose.connection.db.collection(collection.name);
      const count = await col.countDocuments();
      stats[collection.name] = { documentCount: count };
    }

    return stats;
  } catch (error) {
    console.warn(`Could not get collection stats: ${error.message}`);
    return {};
  }
}

async function getMongoVersion() {
  try {
    const version = await mongoose.connection.db.admin().serverStatus();
    return version.version || "unknown";
  } catch (error) {
    return "unknown";
  }
}

async function getDirectorySize(dirPath) {
  try {
    const { stdout } = await execAsync(`dir /s "${dirPath}" | find "bytes"`, {
      shell: true,
    });
    return stdout;
  } catch {
    return "0 bytes";
  }
}

async function directoryExists(dirPath) {
  try {
    const stat = await fsPromises.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  createFullBackup,
  backupDatabase,
  backupFiles,
  listBackups,
  deleteOldBackups,
  exportBackupArchive,
  initBackupDirs,
  BACKUP_DIR,
  BACKUP_DB_DIR,
  BACKUP_FILES_DIR,
};
