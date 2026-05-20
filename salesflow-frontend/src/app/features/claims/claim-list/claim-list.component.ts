import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ClaimService } from '@core/services/claim.service';
import { ToastService } from '@core/services/toast.service';
import { ThemeService } from '@core/services/theme.service';
import { Claim } from '@core/models/claim.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroDocumentText, heroCheckBadge, heroExclamationCircle, heroClock, heroArrowPath, heroArrowLeft, heroCalendarDays } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ListToolbarComponent } from '@shared/components/list-toolbar/list-toolbar.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink, ListToolbarComponent, PaginationComponent, TranslateModule],
  providers: [
    provideIcons({ heroDocumentText, heroCheckBadge, heroExclamationCircle, heroClock, heroArrowPath, heroArrowLeft, heroCalendarDays })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">{{ 'claim.list.title' | translate }}</h1>
          <p class="text-sf-muted font-medium mt-1 flex items-center gap-2">
            تتبع وإدارة حالة التحصيل لجميع المبيعات المؤكدة.
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-sf-primary/10 text-sf-primary border border-sf-primary/20">
              <ng-icon name="heroCalendarDays" class="text-xs"></ng-icon>
              {{ formatQ(themeService.currentQuarter()) }}
            </span>
          </p>
        </div>
        <button (click)="onSyncClaims()" class="btn btn-secondary flex items-center gap-2">
          <ng-icon name="heroArrowPath"></ng-icon>
          <span>{{ 'claim.list.sync_btn' | translate }}</span>
        </button>
      </header>

      <!-- Unified Toolbar -->
      <app-list-toolbar
        placeholder="بحث برقم المطالبة، المبيعة أو العميل..."
        [statusOptions]="statusOptions"
        [activeStatus]="statusFilter()"
        [count]="displayedClaims().length"
        [loading]="loading()"
        (searchChange)="onSearch($event)"
        (statusChange)="onStatusChange($event)"
      />

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="!loading(); else skeleton">
        @for (claim of displayedClaims(); track claim._id) {
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
              <app-badge [color]="getStatusColor(claim.status)">{{ 'claim.list.' + claim.status | translate }}</app-badge>
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
          <div class="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <div class="w-16 h-16 rounded-2xl bg-sf-elevated border border-sf-border border-dashed
                        flex items-center justify-center text-sf-subtle">
              <ng-icon name="heroDocumentText" class="text-2xl"></ng-icon>
            </div>
            <div class="text-center">
              <h3 class="text-base font-bold text-sf-text">{{ 'claim.list.no_data' | translate }}</h3>
              <p class="text-sm text-sf-muted mt-1">
                {{ 'claim.list.no_data' | translate }}
              </p>
            </div>
          </div>
        }
      </div>

      <!-- Pagination -->
      <app-pagination *ngIf="!loading()"
        [currentPage]="currentPage()"
        [totalPages]="effectiveTotalPages()"
        [totalItems]="totalItems()"
        [limit]="limit()"
        (pageChange)="onPageChange($event)"
      />

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
  public themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  claims       = signal<Claim[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  statusFilter = signal('all');

  currentPage = signal(1);
  limit       = signal(6);
  totalItems  = signal(0);
  totalPages  = signal(1);

  readonly statusOptions = [
    { value: 'all',       label: 'الكل' },
    { value: 'pending',   label: 'قيد الانتظار' },
    { value: 'submitted', label: 'تم التقديم' },
    { value: 'collected', label: 'محصلة' },
    { value: 'disputed',  label: 'منازع عليها' },
  ];

  // Client-side filter on the loaded page (server-side when backend supports search param)
  displayedClaims = computed(() => {
    let list = this.claims();
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();

    if (st !== 'all') list = list.filter(c => c.status === st);
    if (q) list = list.filter(c =>
      c.claimNumber?.toLowerCase().includes(q) ||
      (c as any).saleNumber?.toLowerCase().includes(q) ||
      (c as any).clientName?.toLowerCase().includes(q),
    );
    return list;
  });

  // When a client-side filter is active, compute pages from filtered count rather than server total
  effectiveTotalPages = computed(() => {
    const hasFilter = this.searchQuery().trim().length > 0 || this.statusFilter() !== 'all';
    if (hasFilter) return Math.max(1, Math.ceil(this.displayedClaims().length / this.limit()));
    return this.totalPages();
  });

  constructor() {
    effect(() => {
      this.themeService.currentQuarter();
      this.currentPage.set(1);
      this.loadClaims();
    });
  }

  ngOnInit() {}

  loadClaims() {
    this.loading.set(true);
    const params: Record<string, string> = {
      page:      this.currentPage().toString(),
      limit:     this.limit().toString(),
      quarterId: this.themeService.currentQuarter(),
    };
    this.claimService.getClaims(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
      error: () => this.loading.set(false),
    });
  }

  onSearch(query: string)    { this.searchQuery.set(query); this.currentPage.set(1); }
  onStatusChange(st: string) { this.statusFilter.set(st); this.currentPage.set(1); }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadClaims();
  }

  nextPage() { this.onPageChange(this.currentPage() + 1); }
  prevPage()  { this.onPageChange(this.currentPage() - 1); }
  getMin(a: number, b: number) { return Math.min(a, b); }

  onSyncClaims() {
    this.loading.set(true);
    this.claimService.syncClaims().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        // Reset to first page to see newly synced items
        this.currentPage.set(1);
        this.loadClaims();
        const count = res.data?.length || 0;
        this.toastService.showSuccess(
          count > 0
            ? this.translate.instant('claim.list.synced', { count })
            : this.translate.instant('claim.list.synced', { count: 0 })
        );
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toastService.showError(err.error?.message || this.translate.instant('common.error_generic'));
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

  formatQ(q: string): string {
    return formatQuarter(q);
  }
}
