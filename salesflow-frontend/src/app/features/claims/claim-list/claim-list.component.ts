import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimService } from '@core/services/claim.service';
import { ToastService } from '@core/services/toast.service';
import { Claim } from '@core/models/claim.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroDocumentText, heroCheckBadge, heroExclamationCircle, heroClock, heroArrowPath, heroArrowLeft, heroChevronRight } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ heroDocumentText, heroCheckBadge, heroExclamationCircle, heroClock, heroArrowPath, heroArrowLeft, heroChevronRight })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">مطالبات العمولات</h1>
          <p class="text-sf-muted font-medium mt-1">تتبع وإدارة حالة التحصيل لجميع المبيعات المؤكدة.</p>
        </div>
        <button (click)="onSyncClaims()" class="btn btn-secondary flex items-center gap-2">
          <ng-icon name="heroArrowPath"></ng-icon>
          <span>مزامنة المطالبات</span>
        </button>
      </header>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="!loading(); else skeleton">
        @for (claim of claims(); track claim._id) {
          <div [routerLink]="[claim._id]" 
               class="glass-card rounded-2xl border border-sf-border shadow-xl flex flex-col overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:border-sf-primary/40 transition-all duration-300 hover:shadow-glow-purple/5 group">
            <!-- Card Header -->
            <div class="p-5 border-b border-sf-border/30 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sf-surface flex items-center justify-center text-sf-primary border border-sf-border">
                  <ng-icon name="heroDocumentText" class="text-xl"></ng-icon>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-sf-text font-financial">{{ claim.claimNumber }}</h3>
                  <span class="text-[10px] font-black text-sf-muted uppercase tracking-tighter font-financial">{{ claim.saleNumber }}</span>
                </div>
              </div>
              <app-badge [color]="getStatusColor(claim.status)">{{ translateStatus(claim.status) }}</app-badge>
            </div>

            <!-- Card Body -->
            <div class="p-5 flex-1 space-y-4">
              <div>
                <h4 class="text-xs font-bold text-sf-muted uppercase tracking-widest mb-1">المشروع والوحدة</h4>
                <p class="text-sm font-semibold text-sf-text line-clamp-1 font-financial">{{ claim.projectName }} • {{ claim.unitNumber }}</p>
                <p class="text-[10px] font-medium text-sf-muted mt-0.5">{{ claim.clientName }}</p>
              </div>

              <div class="p-4 bg-sf-bg/50 rounded-xl border border-sf-border/50">
                <div class="flex items-center justify-between mb-1 font-financial">
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">العمولة المستحقة</span>
                  <span class="text-sm font-black text-sf-primary">{{ claim.commissionDue | currencyEgp }}</span>
                </div>
                @if (claim.status === 'collected') {
                  <div class="flex items-center justify-between pt-2 mt-2 border-t border-sf-border/30 font-financial">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">تم التحصيل في</span>
                    <span class="text-xs font-bold text-sf-success">{{ claim.collectionDate | date:'mediumDate' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Card Footer -->
            <div class="p-4 bg-sf-surface/20 border-t border-sf-border/30 flex items-center justify-between">
              <span class="text-xs font-black text-sf-primary group-hover:underline flex items-center gap-1.5 transition-all">
                <span>إدارة المطالبة</span>
                <ng-icon name="heroArrowLeft" class="text-sm transform group-hover:-translate-x-1 transition-transform duration-200"></ng-icon>
              </span>
              
              <div class="flex items-center gap-2">
                @if (claim.status === 'pending') {
                  <ng-icon name="heroClock" class="text-sf-warning" title="Pending Collection"></ng-icon>
                } @else if (claim.status === 'collected') {
                  <ng-icon name="heroCheckBadge" class="text-sf-success" title="Fully Collected"></ng-icon>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-32 flex flex-col items-center justify-center text-sf-muted">
            <ng-icon name="heroDocumentText" class="text-5xl mb-4 opacity-10"></ng-icon>
            <h3 class="text-xl font-bold italic">لم يتم العثور على مطالبات نشطة</h3>
            <p class="text-sm font-medium">يتم إنشاء المطالبات تلقائيًا من المبيعات المؤكدة.</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between p-6 bg-sf-surface/30 border border-sf-border rounded-2xl shadow-xl mt-8" *ngIf="totalPages() > 1 && !loading()">
        <span class="text-xs font-bold text-sf-muted uppercase tracking-widest font-financial">
          عرض {{ (currentPage() - 1) * limit() + 1 }} - {{ getMin(currentPage() * limit(), totalItems()) }} من أصل {{ totalItems() }} مطالبة
        </span>
        <div class="flex items-center gap-2">
          <button (click)="prevPage()" 
                  [disabled]="currentPage() === 1"
                  class="p-2.5 bg-sf-bg border border-sf-border rounded-xl text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 disabled:opacity-30 disabled:hover:text-sf-muted disabled:hover:border-sf-border transition-all active:scale-95 flex items-center justify-center">
            <ng-icon name="heroChevronRight" class="text-lg rotate-180"></ng-icon>
          </button>
          <span class="px-4 py-2 bg-sf-primary/10 border border-sf-primary/20 rounded-xl text-xs font-black text-sf-primary font-financial">
            الصفحة {{ currentPage() }} من {{ totalPages() }}
          </span>
          <button (click)="nextPage()" 
                  [disabled]="currentPage() === totalPages()"
                  class="p-2.5 bg-sf-bg border border-sf-border rounded-xl text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 disabled:opacity-30 disabled:hover:text-sf-muted disabled:hover:border-sf-border transition-all active:scale-95 flex items-center justify-center">
            <ng-icon name="heroChevronRight" class="text-lg"></ng-icon>
          </button>
        </div>
      </div>

      <ng-template #skeleton>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="h-64 bg-sf-surface rounded-2xl border border-sf-border skeleton" *ngFor="let i of [1,2,3]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .glass-card {
      backdrop-filter: blur(12px);
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ClaimListComponent implements OnInit {
  private claimService = inject(ClaimService);
  private toastService = inject(ToastService);
  claims = signal<Claim[]>([]);
  loading = signal(true);

  // Pagination Signals
  currentPage = signal(1);
  limit = signal(6); // 6 cards fits beautiful on a 3-column grid
  totalItems = signal(0);
  totalPages = signal(1);

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: this.currentPage().toString(),
      limit: this.limit().toString()
    };
    this.claimService.getClaims(params).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success) {
          this.claims.set(res.data);
          if (res.pagination) {
            this.totalItems.set(res.pagination.total);
            this.totalPages.set(res.pagination.totalPages);
          }
        }
      },
      error: () => this.loading.set(false)
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p: number) => p + 1);
      this.loadClaims();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p: number) => p - 1);
      this.loadClaims();
    }
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  onSyncClaims() {
    this.loading.set(true);
    this.claimService.syncClaims().subscribe({
      next: (res: any) => {
        // Reset to first page to see newly synced items
        this.currentPage.set(1);
        this.loadClaims();
        const count = res.data?.length || 0;
        this.toastService.showSuccess(
          count > 0 
            ? `تمت مزامنة المطالبات بنجاح! تم إنشاء ${count} مطالبة جديدة.` 
            : 'مكتمل: جميع المطالبات قيد التشغيل بالفعل متزامنة بالكامل.'
        );
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toastService.showError(err.error?.message || 'حدث خطأ أثناء مزامنة المطالبات.');
      }
    });
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'collected': return 'محصلة';
      case 'pending': return 'قيد الانتظار';
      case 'submitted': return 'تم التقديم';
      case 'disputed': return 'منازع عليها';
      default: return status;
    }
  }

  getStatusColor(status: string): any {
    switch (status) {
      case 'collected': return 'success';
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'disputed': return 'error';
      default: return 'gray';
    }
  }
}
