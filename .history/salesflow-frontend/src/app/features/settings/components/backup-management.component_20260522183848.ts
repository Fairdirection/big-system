/**
 * Backup Management Component
 * 
 * Location: salesflow-frontend/src/app/features/settings/components/backup-management.component.ts
 * 
 * Usage:
 * <app-backup-management></app-backup-management>
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, interval, takeUntil } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

interface Backup {
  backupId: string;
  backupName: string;
  timestamp: string;
  database: {
    collections: Record<string, any>;
    mongoVersion: string;
  };
  files: {
    size: string;
  };
  status: string;
}

@Component({
  selector: 'app-backup-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backup-management-container">
      <h2>💾 Backup & Recovery</h2>

      <!-- Status Section -->
      <div class="status-section">
        <h3>📊 Backup Status</h3>
        
        <div *ngIf="lastBackup" class="last-backup-card">
          <div class="status-indicator" [class.success]="lastBackup.status === 'success'"></div>
          <div class="backup-info">
            <p class="backup-time">Last Backup: {{ getTimeAgo(lastBackup.timestamp) }}</p>
            <p class="backup-name">{{ lastBackup.backupName }}</p>
            <p class="backup-size">Size: {{ lastBackup.files.size }}</p>
          </div>
          <button (click)="downloadBackup(lastBackup)" class="download-btn">
            ⬇️ Download Latest
          </button>
        </div>

        <div *ngIf="!lastBackup && !loading" class="no-backup">
          ⚠️ No backups found yet
        </div>
      </div>

      <!-- Actions Section -->
      <div class="actions-section">
        <h3>⚙️ Backup Actions</h3>
        
        <div class="action-buttons">
          <button 
            (click)="createBackup()" 
            [disabled]="loading"
            class="btn-primary">
            {{ loading ? '⏳ Creating...' : '✨ Create Backup Now' }}
          </button>
          
          <button 
            (click)="refreshList()" 
            [disabled]="loading"
            class="btn-secondary">
            🔄 Refresh
          </button>
          
          <button 
            (click)="cleanupOldBackups()" 
            [disabled]="loading || backups.length <= 5"
            class="btn-danger">
            🗑️ Cleanup Old
          </button>
        </div>
      </div>

      <!-- Backups List Section -->
      <div class="backups-list-section">
        <h3>📋 All Backups ({{ backups.length }})</h3>
        
        <div *ngIf="loading" class="loading">
          ⏳ Loading backups...
        </div>

        <div *ngIf="!loading && backups.length > 0" class="backups-list">
          <div *ngFor="let backup of backups" class="backup-item">
            <div class="backup-header">
              <span class="backup-name">{{ backup.backupName }}</span>
              <span class="backup-status" [class]="backup.status">{{ backup.status }}</span>
            </div>
            
            <div class="backup-details">
              <span class="detail">📅 {{ formatDate(backup.timestamp) }}</span>
              <span class="detail">📊 {{ Object.keys(backup.database.collections).length }} collections</span>
              <span class="detail">💾 {{ backup.files.size }}</span>
            </div>
            
            <div class="backup-actions">
              <button (click)="downloadBackup(backup)" class="btn-sm">
                ⬇️ Download
              </button>
              <button (click)="viewDetails(backup)" class="btn-sm">
                👁️ Details
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && backups.length === 0" class="no-data">
          No backups available. Create one now! 📦
        </div>
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <h4>ℹ️ About Backups</h4>
        <ul>
          <li>✅ Database backups include all collections</li>
          <li>✅ Photo/file backups included automatically</li>
          <li>✅ Backups run automatically daily at 2:00 AM</li>
          <li>✅ Last 5 backups are kept by default</li>
          <li>✅ Backups can be downloaded and restored anytime</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .backup-management-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 20px;
      color: #333;
    }

    h3 {
      margin: 20px 0 15px;
      color: #555;
      font-size: 1.1em;
    }

    /* Status Section */
    .status-section {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .last-backup-card {
      display: flex;
      align-items: center;
      gap: 15px;
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #4CAF50;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ccc;
    }

    .status-indicator.success {
      background: #4CAF50;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .backup-info {
      flex: 1;
    }

    .backup-info p {
      margin: 3px 0;
      font-size: 0.9em;
    }

    .backup-time {
      color: #666;
      font-size: 0.85em;
    }

    .backup-name {
      color: #333;
      font-weight: 600;
    }

    .backup-size {
      color: #999;
      font-size: 0.85em;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    button {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95em;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #4CAF50;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-secondary {
      background: #2196F3;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #0b7dda;
    }

    .btn-danger {
      background: #f44336;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #da190b;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.85em;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Backups List */
    .backups-list-section {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .backups-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .backup-item {
      background: white;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 10px;
      border-left: 3px solid #2196F3;
    }

    .backup-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .backup-status {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: 600;
    }

    .backup-status.success {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .backup-details {
      display: flex;
      gap: 15px;
      font-size: 0.85em;
      color: #666;
      margin-bottom: 10px;
    }

    .backup-actions {
      display: flex;
      gap: 8px;
    }

    .download-btn {
      padding: 8px 16px;
      background: #4CAF50;
      color: white;
      border-radius: 4px;
      cursor: pointer;
    }

    /* Info Section */
    .info-section {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }

    .info-section h4 {
      margin-top: 0;
      color: #1565c0;
    }

    .info-section ul {
      margin: 10px 0;
      padding-left: 20px;
      color: #555;
    }

    .info-section li {
      margin: 5px 0;
      font-size: 0.95em;
    }

    .loading, .no-data, .no-backup {
      padding: 20px;
      text-align: center;
      color: #666;
    }
  `]
})
export class BackupManagementComponent implements OnInit, OnDestroy {
  backups: Backup[] = [];
  lastBackup: Backup | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private apiUrl = `${environment.apiUrl}/backups`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBackups();
    // Refresh every hour
    interval(3600000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadBackups());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBackups() {
    this.loading = true;
    this.http.get<{ backups: Backup[] }>(this.apiUrl).subscribe({
      next: (response) => {
        this.backups = response.backups;
        this.lastBackup = response.backups[0] || null;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load backups';
        this.loading = false;
      }
    });
  }

  createBackup() {
    this.loading = true;
    this.http.post(`${this.apiUrl}/manual`, {}).subscribe({
      next: () => {
        this.loadBackups();
        alert('✅ Backup created successfully!');
      },
      error: () => {
        alert('❌ Failed to create backup');
        this.loading = false;
      }
    });
  }

  downloadBackup(backup: Backup) {
    window.open(`${this.apiUrl}/${backup.backupName}/download`);
  }

  viewDetails(backup: Backup) {
    alert(`
Backup Details:
━━━━━━━━━━━━━━━
ID: ${backup.backupId}
Date: ${this.formatDate(backup.timestamp)}
Collections: ${Object.keys(backup.database.collections).length}
Size: ${backup.files.size}
Status: ${backup.status}
    `.trim());
  }

  refreshList() {
    this.loadBackups();
  }

  cleanupOldBackups() {
    if (confirm('⚠️ Delete backups older than the last 5? This cannot be undone.')) {
      this.loading = true;
      this.http.delete(`${this.apiUrl}/cleanup`, { body: { keepCount: 5 } }).subscribe({
        next: () => {
          this.loadBackups();
          alert('✅ Cleanup completed!');
        },
        error: () => {
          alert('❌ Cleanup failed');
          this.loading = false;
        }
      });
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
