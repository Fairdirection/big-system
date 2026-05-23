import { Component, OnInit, OnDestroy, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Subject, interval, takeUntil } from "rxjs";
import { environment } from "@env/environment";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import {
  heroArchiveBox,
  heroArrowDownTray,
  heroCheckCircle,
  heroExclamationCircle,
  heroSparkles,
  heroArrowPath,
  heroTrash,
} from "@ng-icons/heroicons/outline";

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
  selector: "app-backup-management",
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      heroArchiveBox,
      heroArrowDownTray,
      heroCheckCircle,
      heroExclamationCircle,
      heroSparkles,
      heroArrowPath,
      heroTrash,
    }),
  ],
  template: `
    <div class="space-y-6 animate-fade-in text-right">
      <!-- Header Section -->
      <section
        class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-lg font-display font-bold text-sf-text">
              💾 Backup & Recovery
            </h3>
            <p class="text-xs text-sf-muted mt-2">
              نسخ احتياطية آمنة للبيانات والصور. يتم حفظ نسخة احتياطية تلقائياً يومياً الساعة
              2:00 صباحاً
            </p>
          </div>
        </div>

        <!-- Last Backup Status -->
        <div
          *ngIf="lastBackup"
          class="mt-6 p-4 bg-sf-primary/5 border border-sf-primary/20 rounded-2xl"
        >
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <ng-icon
                name="heroCheckCircle"
                class="text-2xl text-sf-success"
              ></ng-icon>
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-sf-text">آخر نسخة احتياطية</p>
              <p class="text-xs text-sf-muted mt-0.5">
                {{ formatDate(lastBackup.timestamp) }}
              </p>
            </div>
            <button
              (click)="downloadBackup(lastBackup)"
              class="px-4 py-2 bg-sf-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all"
            >
              <ng-icon
                name="heroArrowDownTray"
                class="inline mr-1"
              ></ng-icon>
              تحميل
            </button>
          </div>
        </div>

        <div
          *ngIf="!lastBackup && !loading"
          class="mt-4 p-4 bg-sf-warning/5 border border-sf-warning/20 rounded-2xl flex items-center gap-3"
        >
          <ng-icon
            name="heroExclamationCircle"
            class="text-2xl text-sf-warning flex-shrink-0"
          ></ng-icon>
          <div>
            <p class="text-sm font-bold text-sf-text">لا توجد نسخ احتياطية</p>
            <p class="text-xs text-sf-muted">قم بإنشاء نسخة احتياطية الآن</p>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section
        class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-4"
      >
        <h4 class="text-sm font-display font-bold text-sf-text">إجراءات</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            (click)="createBackup()"
            [disabled]="loading"
            class="w-full px-4 py-3 bg-sf-success text-white rounded-2xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ng-icon name="heroSparkles" class="text-lg"></ng-icon>
            {{
              loading
                ? "جاري الإنشاء..."
                : "إنشاء نسخة احتياطية الآن"
            }}
          </button>

          <button
            (click)="refreshList()"
            [disabled]="loading"
            class="w-full px-4 py-3 bg-sf-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ng-icon name="heroArrowPath" class="text-lg"></ng-icon>
            تحديث
          </button>

          <button
            (click)="cleanupOldBackups()"
            [disabled]="loading || backups.length <= 5"
            class="w-full px-4 py-3 bg-sf-danger text-white rounded-2xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ng-icon name="heroTrash" class="text-lg"></ng-icon>
            حذف القديمة
          </button>
        </div>
      </section>

      <!-- Backups List -->
      <section
        class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-4"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-display font-bold text-sf-text">
            جميع النسخ الاحتياطية
          </h4>
          <span class="text-xs font-bold text-sf-muted bg-sf-bg/50 px-3 py-1.5 rounded-xl">
            {{ backups.length }}
          </span>
        </div>

        <div *ngIf="loading" class="py-12 text-center">
          <p class="text-sm text-sf-muted">⏳ جاري التحميل...</p>
        </div>

        <div *ngIf="!loading && backups.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
          @for (backup of backups; track backup.backupId) {
            <div
              class="flex items-center justify-between p-4 bg-sf-bg/40 rounded-2xl border border-sf-border/70 hover:border-sf-primary/30 transition-all group"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <ng-icon
                    name="heroArchiveBox"
                    class="text-lg text-sf-primary"
                  ></ng-icon>
                  <span class="text-sm font-bold text-sf-text">{{
                    backup.backupName
                  }}</span>
                  <span
                    class="text-[10px] font-bold px-2 py-1 rounded-lg"
                    [ngClass]="{
                      'bg-sf-success/10 text-sf-success':
                        backup.status === 'success',
                      'bg-sf-warning/10 text-sf-warning':
                        backup.status !== 'success',
                    }"
                  >
                    {{ backup.status === "success" ? "✓ نجاح" : "⚠ خطأ" }}
                  </span>
                </div>
                <p class="text-xs text-sf-muted">
                  📅 {{ formatDate(backup.timestamp) }} • 📊
                  {{ Object.keys(backup.database.collections).length }}
                  مجموعات • 💾 {{ backup.files.size }}
                </p>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button
                  (click)="downloadBackup(backup)"
                  class="px-3 py-2 bg-sf-primary/10 text-sf-primary hover:bg-sf-primary/20 rounded-lg text-xs font-bold transition-all"
                  title="تحميل النسخة الاحتياطية"
                >
                  <ng-icon name="heroArrowDownTray"></ng-icon>
                </button>
                <button
                  (click)="viewDetails(backup)"
                  class="px-3 py-2 bg-sf-muted/10 text-sf-muted hover:bg-sf-muted/20 rounded-lg text-xs font-bold transition-all"
                  title="عرض التفاصيل"
                >
                  ℹ️
                </button>
              </div>
            </div>
          }
        </div>

        <div *ngIf="!loading && backups.length === 0" class="py-12 text-center">
          <ng-icon
            name="heroArchiveBox"
            class="text-6xl text-sf-muted/20 mx-auto mb-4"
          ></ng-icon>
          <p class="text-sm text-sf-muted">لا توجد نسخ احتياطية متاحة</p>
          <p class="text-xs text-sf-muted/70 mt-1">قم بإنشاء نسخة احتياطية الآن</p>
        </div>
      </section>

      <!-- Info & Tips -->
      <section
        class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border/50 bg-sf-primary/5 shadow-2xl space-y-4"
      >
        <h4 class="text-sm font-display font-bold text-sf-text">
          ℹ️ معلومات مهمة
        </h4>
        <ul class="space-y-2 text-right">
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-1">✓</span>
            <span>النسخ الاحتياطية تشمل جميع البيانات والصور</span>
          </li>
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-1">✓</span>
            <span>تتم النسخ الاحتياطية تلقائياً يومياً في تمام الساعة 2:00 صباحاً</span>
          </li>
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-1">✓</span>
            <span>يتم الاحتفاظ بآخر 5 نسخ احتياطية افتراضياً</span>
          </li>
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-1">✓</span>
            <span>يمكن تحميل واستعادة أي نسخة احتياطية في أي وقت</span>
          </li>
        </ul>
      </section>
    </div>
  `,
})
export class BackupManagementComponent implements OnInit, OnDestroy {
  // Expose Object to template
  Object = Object;

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
        this.error = "Failed to load backups";
        this.loading = false;
      },
    });
  }

  createBackup() {
    this.loading = true;
    this.http.post(`${this.apiUrl}/manual`, {}).subscribe({
      next: () => {
        this.loadBackups();
        alert("✅ Backup created successfully!");
      },
      error: () => {
        alert("❌ Failed to create backup");
        this.loading = false;
      },
    });
  }

  downloadBackup(backup: Backup) {
    window.open(`${this.apiUrl}/${backup.backupName}/download`);
  }

  viewDetails(backup: Backup) {
    alert(
      `
Backup Details:
━━━━━━━━━━━━━━━
ID: ${backup.backupId}
Date: ${this.formatDate(backup.timestamp)}
Collections: ${Object.keys(backup.database.collections).length}
Size: ${backup.files.size}
Status: ${backup.status}
    `.trim(),
    );
  }

  refreshList() {
    this.loadBackups();
  }

  cleanupOldBackups() {
    if (
      confirm("⚠️ Delete backups older than the last 5? This cannot be undone.")
    ) {
      this.loading = true;
      this.http
        .delete(`${this.apiUrl}/cleanup`, { body: { keepCount: 5 } })
        .subscribe({
          next: () => {
            this.loadBackups();
            alert("✅ Cleanup completed!");
          },
          error: () => {
            alert("❌ Cleanup failed");
            this.loading = false;
          },
        });
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
