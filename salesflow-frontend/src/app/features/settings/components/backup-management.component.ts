import { Component, OnInit, OnDestroy, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Subject, interval, takeUntil } from "rxjs";
import { environment } from "@env/environment";
import { NgIconComponent, provideIcons } from "@ng-icons/core";
import { TranslateModule } from "@ngx-translate/core";
import {
  heroArchiveBox,
  heroArrowDownTray,
  heroCheckCircle,
  heroExclamationCircle,
  heroSparkles,
  heroArrowPath,
  heroTrash,
  heroInformationCircle,
  heroClock,
  heroSquares2x2,
  heroDocument,
  heroChevronDown,
  heroChevronUp,
  heroXMark,
  heroShieldCheck,
} from "@ng-icons/heroicons/outline";

interface Backup {
  backupId: string;
  backupName: string;
  timestamp: string;
  database: {
    collections: Record<string, { documentCount: number }>;
    mongoVersion: string;
    size?: string;
  };
  files: {
    size: string;
  };
  status: string;
  environment?: string;
}

@Component({
  selector: "app-backup-management",
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslateModule],
  providers: [
    provideIcons({
      heroArchiveBox,
      heroArrowDownTray,
      heroCheckCircle,
      heroExclamationCircle,
      heroSparkles,
      heroArrowPath,
      heroTrash,
      heroInformationCircle,
      heroClock,
      heroSquares2x2,
      heroDocument,
      heroChevronDown,
      heroChevronUp,
      heroXMark,
      heroShieldCheck,
    }),
  ],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Global Loading Overlay (create backup only) -->
      @if (creatingBackup()) {
        <div class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl flex flex-col items-center gap-4 animate-scale-in">
            <div class="relative w-16 h-16">
              <div class="absolute inset-0 bg-gradient-to-r from-sf-primary via-sf-success to-sf-primary rounded-full backup-spinner"></div>
              <div class="absolute inset-1 bg-sf-bg rounded-full flex items-center justify-center">
                <ng-icon name="heroArchiveBox" class="text-2xl text-sf-primary"></ng-icon>
              </div>
            </div>
            <div class="text-center">
              <p class="text-lg font-display font-bold text-sf-text">جاري إنشاء النسخة الاحتياطية</p>
              <p class="text-xs text-sf-muted mt-2">يرجى عدم إغلاق هذه الصفحة...</p>
            </div>
            <div class="flex items-center justify-center gap-1">
              <span class="w-2 h-2 bg-sf-primary rounded-full dot-bounce" style="animation-delay:0s"></span>
              <span class="w-2 h-2 bg-sf-primary rounded-full dot-bounce" style="animation-delay:.2s"></span>
              <span class="w-2 h-2 bg-sf-primary rounded-full dot-bounce" style="animation-delay:.4s"></span>
            </div>
          </div>
        </div>
      }

      <!-- Toast Notification -->
      @if (notification(); as notif) {
        <div
          class="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border flex items-center gap-2 shadow-lg slide-in-toast"
          [ngClass]="{
            'bg-sf-success/10 border-sf-success text-sf-success': notif.type === 'success',
            'bg-sf-danger/10 border-sf-danger text-sf-danger': notif.type === 'error',
            'bg-sf-warning/10 border-sf-warning text-sf-warning': notif.type === 'warning'
          }"
        >
          <ng-icon
            [name]="notif.type === 'success' ? 'heroCheckCircle' : 'heroExclamationCircle'"
            class="text-lg flex-shrink-0"
          ></ng-icon>
          <span class="text-sm font-bold">{{ notif.message }}</span>
        </div>
      }

      <!-- Header: Status Overview -->
      <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl">
        <div class="flex items-start justify-between gap-4 mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-sf-primary/10 flex items-center justify-center flex-shrink-0">
              <ng-icon name="heroArchiveBox" class="text-xl text-sf-primary"></ng-icon>
            </div>
            <div>
              <h3 class="text-base font-display font-bold text-sf-text">النسخ الاحتياطية</h3>
              <p class="text-xs text-sf-muted">حماية بياناتك وصورك</p>
            </div>
          </div>
          <span class="text-xs font-bold px-3 py-1.5 rounded-xl bg-sf-success/10 text-sf-success border border-sf-success/20">
            تلقائي 2:00 ص
          </span>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-3">
          <div class="p-3 bg-sf-bg/50 rounded-2xl border border-sf-border/50 text-center">
            <p class="text-2xl font-display font-bold text-sf-primary">{{ backups.length }}</p>
            <p class="text-[10px] text-sf-muted mt-0.5">إجمالي النسخ</p>
          </div>
          <div class="p-3 bg-sf-bg/50 rounded-2xl border border-sf-border/50 text-center">
            <p class="text-2xl font-display font-bold text-sf-success">
              {{ backups.length > 0 ? '✓' : '—' }}
            </p>
            <p class="text-[10px] text-sf-muted mt-0.5">الحالة</p>
          </div>
          <div class="p-3 bg-sf-bg/50 rounded-2xl border border-sf-border/50 text-center">
            <p class="text-2xl font-display font-bold text-sf-accent">5</p>
            <p class="text-[10px] text-sf-muted mt-0.5">الحد الأقصى</p>
          </div>
        </div>

        <!-- Last Backup Banner -->
        @if (lastBackup) {
          <div class="mt-4 p-4 bg-sf-success/5 border border-sf-success/20 rounded-2xl flex items-center gap-3">
            <ng-icon name="heroCheckCircle" class="text-2xl text-sf-success flex-shrink-0"></ng-icon>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-sf-text">آخر نسخة احتياطية</p>
              <p class="text-xs text-sf-muted mt-0.5 truncate">{{ formatDate(lastBackup.timestamp) }}</p>
            </div>
            <button
              (click)="downloadBackup(lastBackup)"
              [disabled]="downloadingId() === lastBackup.backupId"
              class="flex-shrink-0 px-4 py-2 bg-sf-primary text-white rounded-xl text-xs font-bold hover:brightness-110 disabled:opacity-60 disabled:cursor-wait transition-all flex items-center gap-1.5"
            >
              @if (downloadingId() === lastBackup.backupId) {
                <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block list-spinner"></div>
              } @else {
                <ng-icon name="heroArrowDownTray" class="text-sm"></ng-icon>
              }
              {{ downloadingId() === lastBackup.backupId ? 'جاري التحميل...' : 'تحميل' }}
            </button>
          </div>
        }

        @if (!lastBackup && !loading()) {
          <div class="mt-4 p-4 bg-sf-warning/5 border border-sf-warning/20 rounded-2xl flex items-center gap-3">
            <ng-icon name="heroExclamationCircle" class="text-2xl text-sf-warning flex-shrink-0"></ng-icon>
            <div>
              <p class="text-sm font-bold text-sf-text">لا توجد نسخ احتياطية</p>
              <p class="text-xs text-sf-muted">أنشئ نسخة احتياطية الآن لحماية بياناتك</p>
            </div>
          </div>
        }
      </section>

      <!-- Action Buttons -->
      <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl">
        <h4 class="text-xs font-display font-bold text-sf-muted uppercase tracking-wider mb-4">الإجراءات</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            (click)="createBackup()"
            [disabled]="isBusy()"
            class="w-full px-4 py-3 bg-sf-success text-white rounded-2xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ng-icon name="heroSparkles" class="text-lg"></ng-icon>
            {{ creatingBackup() ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية' }}
          </button>

          <button
            (click)="refreshList()"
            [disabled]="isBusy()"
            class="w-full px-4 py-3 bg-sf-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ng-icon name="heroArrowPath" class="text-lg" [class.spinning]="loading()"></ng-icon>
            تحديث القائمة
          </button>

          <button
            (click)="cleanupOldBackups()"
            [disabled]="isBusy() || backups.length <= 5"
            class="w-full px-4 py-3 bg-sf-danger text-white rounded-2xl text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <ng-icon name="heroTrash" class="text-lg"></ng-icon>
            حذف القديمة ({{ oldBackupCount() }})
          </button>
        </div>
      </section>

      <!-- Backups List -->
      <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-xs font-display font-bold text-sf-muted uppercase tracking-wider">جميع النسخ الاحتياطية</h4>
          <span class="text-xs font-bold text-sf-muted bg-sf-bg/50 px-3 py-1.5 rounded-xl border border-sf-border/50">
            {{ backups.length }} نسخة
          </span>
        </div>

        @if (loading()) {
          <div class="py-12 text-center space-y-3">
            <div class="w-8 h-8 border-2 border-sf-primary border-t-transparent rounded-full inline-block list-spinner"></div>
            <p class="text-sm text-sf-muted">جاري تحميل النسخ الاحتياطية...</p>
          </div>
        }

        @if (!loading() && backups.length === 0) {
          <div class="py-12 text-center">
            <ng-icon name="heroArchiveBox" class="text-5xl text-sf-muted/20 mx-auto mb-3"></ng-icon>
            <p class="text-sm text-sf-muted">لا توجد نسخ احتياطية</p>
            <p class="text-xs text-sf-muted/60 mt-1">أنشئ نسخة احتياطية أولى الآن</p>
          </div>
        }

        @if (!loading() && backups.length > 0) {
          <div class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            @for (backup of backups; track backup.backupId) {
              <div
                class="rounded-2xl border transition-all duration-200"
                [ngClass]="{
                  'border-sf-primary/30 bg-sf-primary/5': expandedId() === backup.backupId,
                  'border-sf-border/70 bg-sf-bg/30 hover:border-sf-border': expandedId() !== backup.backupId
                }"
              >
                <!-- Row -->
                <div class="flex items-center gap-3 p-4">
                  <!-- Icon -->
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    [ngClass]="backup.status === 'success' ? 'bg-sf-success/10' : 'bg-sf-warning/10'"
                  >
                    <ng-icon
                      name="heroArchiveBox"
                      class="text-lg"
                      [ngClass]="backup.status === 'success' ? 'text-sf-success' : 'text-sf-warning'"
                    ></ng-icon>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-bold text-sf-text truncate max-w-[180px]" [title]="backup.backupName">
                        {{ formatBackupLabel(backup.backupName) }}
                      </span>
                      <span
                        class="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                        [ngClass]="backup.status === 'success' ? 'bg-sf-success/10 text-sf-success' : 'bg-sf-warning/10 text-sf-warning'"
                      >
                        {{ backup.status === 'success' ? '✓ ناجح' : '⚠ خطأ' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-[11px] text-sf-muted flex-wrap">
                      <span class="flex items-center gap-1">
                        <ng-icon name="heroClock" class="text-xs"></ng-icon>
                        {{ formatDate(backup.timestamp) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <ng-icon name="heroSquares2x2" class="text-xs"></ng-icon>
                        {{ getCollectionCount(backup) }} مجموعات
                      </span>
                      <span class="flex items-center gap-1">
                        <ng-icon name="heroDocument" class="text-xs"></ng-icon>
                        {{ backup.database.size || backup.files.size || '—' }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <!-- Expand Details -->
                    <button
                      (click)="toggleExpanded(backup)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-sf-muted hover:bg-sf-bg hover:text-sf-text transition-all"
                      [title]="expandedId() === backup.backupId ? 'إخفاء التفاصيل' : 'عرض التفاصيل'"
                    >
                      <ng-icon [name]="expandedId() === backup.backupId ? 'heroChevronUp' : 'heroChevronDown'" class="text-sm"></ng-icon>
                    </button>

                    <!-- Download -->
                    <button
                      (click)="downloadBackup(backup)"
                      [disabled]="deletingId() === backup.backupId || downloadingId() === backup.backupId"
                      class="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                      [ngClass]="downloadingId() === backup.backupId
                        ? 'bg-sf-primary/20 text-sf-primary cursor-wait'
                        : 'bg-sf-primary/10 text-sf-primary hover:bg-sf-primary/20 disabled:opacity-40 disabled:cursor-not-allowed'"
                      title="تحميل النسخة الاحتياطية"
                    >
                      @if (downloadingId() === backup.backupId) {
                        <div class="w-3.5 h-3.5 border-2 border-sf-primary border-t-transparent rounded-full inline-block list-spinner"></div>
                      } @else {
                        <ng-icon name="heroArrowDownTray" class="text-sm"></ng-icon>
                      }
                    </button>

                    <!-- Delete -->
                    <button
                      (click)="deleteBackup(backup)"
                      [disabled]="isBusy()"
                      class="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                      [ngClass]="deletingId() === backup.backupId
                        ? 'bg-sf-danger/20 text-sf-danger cursor-wait'
                        : 'bg-sf-danger/10 text-sf-danger hover:bg-sf-danger/25 disabled:opacity-40 disabled:cursor-not-allowed'"
                      title="حذف هذه النسخة الاحتياطية"
                    >
                      @if (deletingId() === backup.backupId) {
                        <div class="w-3.5 h-3.5 border-2 border-sf-danger border-t-transparent rounded-full inline-block list-spinner"></div>
                      } @else {
                        <ng-icon name="heroTrash" class="text-sm"></ng-icon>
                      }
                    </button>
                  </div>
                </div>

                <!-- Expanded Details Panel -->
                @if (expandedId() === backup.backupId) {
                  <div class="px-4 pb-4 border-t border-sf-border/50 pt-3 animate-fade-in">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      <div class="p-2.5 bg-sf-bg/60 rounded-xl">
                        <p class="text-[10px] text-sf-muted">المعرف</p>
                        <p class="text-xs font-bold text-sf-text mt-0.5 truncate" [title]="backup.backupId">
                          {{ backup.backupId.substring(0, 8) }}...
                        </p>
                      </div>
                      <div class="p-2.5 bg-sf-bg/60 rounded-xl">
                        <p class="text-[10px] text-sf-muted">إصدار MongoDB</p>
                        <p class="text-xs font-bold text-sf-text mt-0.5">{{ backup.database.mongoVersion || '—' }}</p>
                      </div>
                      <div class="p-2.5 bg-sf-bg/60 rounded-xl">
                        <p class="text-[10px] text-sf-muted">البيئة</p>
                        <p class="text-xs font-bold text-sf-text mt-0.5">{{ backup.environment || 'development' }}</p>
                      </div>
                      <div class="p-2.5 bg-sf-bg/60 rounded-xl">
                        <p class="text-[10px] text-sf-muted">حجم النسخة</p>
                        <p class="text-xs font-bold text-sf-text mt-0.5">{{ backup.database.size || backup.files.size || '—' }}</p>
                      </div>
                    </div>

                    <!-- Collections breakdown -->
                    @if (getCollectionCount(backup) > 0) {
                      <div>
                        <p class="text-[10px] text-sf-muted uppercase tracking-wider mb-2">المجموعات</p>
                        <div class="flex flex-wrap gap-1.5">
                          @for (entry of getCollectionEntries(backup); track entry[0]) {
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-sf-primary/8 border border-sf-primary/15 rounded-lg text-[11px] text-sf-text">
                              <span class="font-bold">{{ entry[0] }}</span>
                              <span class="text-sf-muted">{{ entry[1].documentCount }}</span>
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </section>

      <!-- Info Tips -->
      <section class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border/50 bg-sf-primary/5 shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <ng-icon name="heroShieldCheck" class="text-xl text-sf-primary flex-shrink-0"></ng-icon>
          <h4 class="text-sm font-display font-bold text-sf-text">معلومات مهمة</h4>
        </div>
        <ul class="space-y-2.5">
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-0.5 flex-shrink-0">✓</span>
            <span>النسخ الاحتياطية تشمل جميع البيانات والصور المرفوعة</span>
          </li>
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-0.5 flex-shrink-0">✓</span>
            <span>تتم النسخ الاحتياطية تلقائياً يومياً في تمام الساعة 2:00 صباحاً</span>
          </li>
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-success mt-0.5 flex-shrink-0">✓</span>
            <span>يتم الاحتفاظ بآخر 5 نسخ احتياطية تلقائياً — "حذف القديمة" يُبقي الـ 5 الأحدث</span>
          </li>
          <li class="text-xs text-sf-text flex items-start gap-2">
            <span class="text-sf-warning mt-0.5 flex-shrink-0">⚠</span>
            <span>حذف النسخة الاحتياطية لا يمكن التراجع عنه، تأكد قبل الحذف</span>
          </li>
        </ul>
      </section>

    </div>
  `,
  styles: [`
    @keyframes backup-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes list-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes dot-bounce {
      0%, 80%, 100% { opacity: 1; transform: translateY(0); }
      40% { opacity: .5; transform: translateY(-8px); }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scale-in {
      from { opacity: 0; transform: scale(.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slide-in-right {
      from { opacity: 0; transform: translateX(80px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .backup-spinner { animation: backup-spin 3s linear infinite; }
    .list-spinner { animation: list-spin .8s linear infinite; }
    .dot-bounce { animation: dot-bounce 1.4s infinite; }
    .animate-fade-in { animation: fade-in .3s ease-out; }
    .animate-scale-in { animation: scale-in .3s ease-out; }
    .slide-in-toast { animation: slide-in-right .3s ease-out; }

    .spinning { animation: list-spin .8s linear infinite; }
  `],
})
export class BackupManagementComponent implements OnInit, OnDestroy {
  Object = Object;

  backups: Backup[] = [];
  lastBackup: Backup | null = null;

  loading = signal(false);
  creatingBackup = signal(false);
  deletingId = signal<string | null>(null);
  downloadingId = signal<string | null>(null);
  expandedId = signal<string | null>(null);

  notification = signal<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  private destroy$ = new Subject<void>();
  private apiUrl = `${environment.apiUrl}/backups`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBackups();
    interval(3600000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadBackups());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isBusy(): boolean {
    return this.loading() || this.creatingBackup() || this.deletingId() !== null;
  }

  oldBackupCount(): number {
    return Math.max(this.backups.length - 5, 0);
  }

  private showNotification(type: "success" | "error" | "warning", message: string, duration = 4000) {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), duration);
  }

  loadBackups() {
    this.loading.set(true);
    this.http.get<{ backups: Backup[] }>(this.apiUrl).subscribe({
      next: (response) => {
        this.backups = response.backups ?? [];
        this.lastBackup = this.backups[0] ?? null;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showNotification("error", "فشل تحميل النسخ الاحتياطية");
      },
    });
  }

  createBackup() {
    if (this.isBusy()) return;
    this.creatingBackup.set(true);
    this.http.post(`${this.apiUrl}/manual`, {}).subscribe({
      next: () => {
        this.creatingBackup.set(false);
        this.showNotification("success", "✅ تم إنشاء النسخة الاحتياطية بنجاح");
        this.loadBackups();
      },
      error: () => {
        this.creatingBackup.set(false);
        this.showNotification("error", "❌ فشل إنشاء النسخة الاحتياطية");
      },
    });
  }

  downloadBackup(backup: Backup) {
    if (this.downloadingId() === backup.backupId) return;
    this.downloadingId.set(backup.backupId);
    this.showNotification("success", "⬇️ جاري إعداد ملف التحميل...", 8000);

    this.http
      .get(`${this.apiUrl}/${backup.backupName}/download`, {
        responseType: "blob",
        observe: "response",
      })
      .subscribe({
        next: (response) => {
          const blob = response.body!;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${backup.backupName}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.downloadingId.set(null);
          this.showNotification("success", "✅ تم تحميل النسخة الاحتياطية بنجاح");
        },
        error: () => {
          this.downloadingId.set(null);
          this.showNotification("error", "❌ فشل تحميل النسخة الاحتياطية");
        },
      });
  }

  deleteBackup(backup: Backup) {
    if (this.isBusy()) return;
    const confirmed = confirm(
      `⚠️ حذف النسخة الاحتياطية\n\n"${this.formatBackupLabel(backup.backupName)}"\n\nهذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟`
    );
    if (!confirmed) return;

    this.deletingId.set(backup.backupId);
    if (this.expandedId() === backup.backupId) this.expandedId.set(null);

    this.http.delete(`${this.apiUrl}/${backup.backupName}`).subscribe({
      next: () => {
        this.backups = this.backups.filter((b) => b.backupId !== backup.backupId);
        this.lastBackup = this.backups[0] ?? null;
        this.deletingId.set(null);
        this.showNotification("success", "✅ تم حذف النسخة الاحتياطية بنجاح");
      },
      error: () => {
        this.deletingId.set(null);
        this.showNotification("error", "❌ فشل حذف النسخة الاحتياطية");
      },
    });
  }

  cleanupOldBackups() {
    if (this.isBusy() || this.backups.length <= 5) return;
    const toDelete = this.backups.length - 5;
    const confirmed = confirm(
      `⚠️ حذف النسخ الاحتياطية القديمة\n\nسيتم حذف ${toDelete} نسخة قديمة والإبقاء على آخر 5 نسخ.\nلا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

    this.loading.set(true);
    this.http.delete(`${this.apiUrl}/cleanup`, { body: { keepCount: 5 } }).subscribe({
      next: () => {
        this.showNotification("success", `✅ تم حذف ${toDelete} نسخة قديمة بنجاح`);
        this.loadBackups();
      },
      error: () => {
        this.loading.set(false);
        this.showNotification("error", "❌ فشل حذف النسخ القديمة");
      },
    });
  }

  refreshList() {
    if (this.isBusy()) return;
    this.loadBackups();
    this.showNotification("success", "🔄 تم تحديث القائمة");
  }

  toggleExpanded(backup: Backup) {
    this.expandedId.set(this.expandedId() === backup.backupId ? null : backup.backupId);
  }

  getCollectionCount(backup: Backup): number {
    return Object.keys(backup.database?.collections ?? {}).length;
  }

  getCollectionEntries(backup: Backup): [string, { documentCount: number }][] {
    return Object.entries(backup.database?.collections ?? {}) as [string, { documentCount: number }][];
  }

  formatBackupLabel(backupName: string): string {
    // backup-2026-05-22T10-30-45-123Z-abc12def → "22/05/2026 10:30"
    const match = backupName.match(/backup-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})/);
    if (match) {
      const [, y, mo, d, h, mi] = match;
      return `${d}/${mo}/${y} ${h}:${mi}`;
    }
    return backupName;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
