# 🔐 FairDirection Backup System - Quick Reference

## ⚡ Quick Commands

```bash
# Create backup NOW
npm run backup

# View all backups
npm run backup list

# Delete old backups (keep last 5)
npm run backup clean

# Export as ZIP for download
npm run backup export backup-2026-05-22-abc12345

# Show help
npm run backup help
```

## 🌐 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/backups/manual` | Create manual backup |
| `GET` | `/api/v1/backups` | List all backups |
| `GET` | `/api/v1/backups/:name` | Get backup details |
| `GET` | `/api/v1/backups/:name/download` | Download as ZIP |
| `DELETE` | `/api/v1/backups/cleanup` | Clean old backups |

## 📍 Backup Locations

```
📁 backups/
   ├── 📁 database/
   │   └── 📁 backup-2026-05-22-xxx/
   │       ├── users.json
   │       ├── employees.json
   │       ├── sales.json
   │       └── ... (other collections)
   ├── 📁 files/
   │   └── 📁 backup-2026-05-22-xxx/
   │       └── (all photos/uploads)
   └── 📄 backup-2026-05-22-xxx-manifest.json
```

## ⏰ Automatic Scheduling

Set in `.env`:
```env
BACKUP_SCHEDULE=0 2 * * *        # When: 2:00 AM daily
BACKUP_CLEANUP=0 3 * * 0         # When: 3:00 AM every Sunday
BACKUP_KEEP_COUNT=5              # Keep: last 5 backups
```

## 🎯 Backup Includes

✅ **Database:**
- Users, Employees, Teams
- Sales, Claims, Commissions
- Targets, Audits, Settings

✅ **Files:**
- Employee avatars
- Project photos
- Invoices & documents

✅ **Metadata:**
- Backup ID & timestamp
- Collection statistics
- Backup status

## 🚀 10 Creative Ideas

### 1️⃣ Cloud Storage Sync
Automatically upload to AWS S3, Google Cloud, or Azure

### 2️⃣ Email Notifications
Get alerts when backups complete or fail

### 3️⃣ Backup Dashboard Widget
Monitor backup status on admin dashboard

### 4️⃣ Incremental Backups
Only backup changed data (faster, less storage)

### 5️⃣ Geo-Redundant Storage
Store copies in multiple global locations

### 6️⃣ Backup Health Monitoring
Alert if last backup was > 24 hours ago

### 7️⃣ Version Control Tags
Label backups as `daily`, `weekly`, `monthly`, `quarterly`

### 8️⃣ One-Click Restoration
Simple UI to restore from any backup

### 9️⃣ Backup Integrity Verification
Automatically verify backup completeness

### 🔟 Differential Backups
Smart scheduling: 2-hour, daily, weekly, monthly, quarterly

## 📋 First-Time Setup

1. Install packages:
   ```bash
   npm install
   ```

2. Configure `.env`:
   ```env
   BACKUP_SCHEDULE=0 2 * * *
   BACKUP_CLEANUP=0 3 * * 0
   BACKUP_KEEP_COUNT=5
   ```

3. Start server:
   ```bash
   npm run dev
   ```

4. Test backup:
   ```bash
   npm run backup
   ```

5. Verify backup created:
   ```bash
   npm run backup list
   ```

## 🛠️ Troubleshooting

**Backups not running?**
- Check MongoDB connection
- Verify `.env` configuration
- Check server console for errors

**Storage running low?**
- Run: `npm run backup clean 3` (keep only 3)
- Enable cloud backup option
- Consider incremental backups

**Need to restore?**
- Contact development team
- Provide backup ID from manifest
- System will restore data & restart

## 📞 Need Help?

See detailed guide: [BACKUP_GUIDE.md](../BACKUP_GUIDE.md)

---

**Version:** 1.0  
**Last Updated:** May 22, 2026
