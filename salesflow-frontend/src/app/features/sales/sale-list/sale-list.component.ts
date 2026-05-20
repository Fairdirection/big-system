import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, Input, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { SaleService } from '@core/services/sale.service';
import { ThemeService } from '@core/services/theme.service';
import { Sale } from '@core/models/sale.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroChevronRight, heroEllipsisVertical, heroShoppingBag, heroCalendar } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ListToolbarComponent, ToolbarStatusOption, ToolbarSortOption } from '@shared/components/list-toolbar/list-toolbar.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink, ListToolbarComponent, PaginationComponent, TranslateModule],
  providers: [
    provideIcons({ heroPlus, heroChevronRight, heroEllipsisVertical, heroShoppingBag, heroCalendar })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">{{ 'sale.list.title' | translate }}</h1>
          <p class="text-sf-muted font-medium mt-1">إدارة وتتبع جميع المبيعات المؤكدة والعمولات للربع الحالي.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2 shadow-glow-sm">
          <ng-icon name="heroPlus"></ng-icon>
          <span>{{ 'sale.list.add' | translate }}</span>
        </button>
      </header>

      <!-- Quarter selector (global, separate from toolbar) -->
      <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sf-surface border border-sf-border
                  shadow-sm self-start w-full sm:w-auto">
        <ng-icon name="heroCalendar" class="text-sf-primary text-base flex-shrink-0"></ng-icon>
        <p class="text-[10px] font-black text-sf-muted whitespace-nowrap">الربع المالي</p>
        <select [value]="currentQuarter()" (change)="onQuarterChange($event)"
                class="bg-transparent text-sf-text text-sm font-bold outline-none border-none cursor-pointer flex-1">
          @for (q of availableQuarters(); track q) {
            <option [value]="q" class="bg-sf-surface">{{ formatQ(q) }}</option>
          }
        </select>
      </div>

      <!-- Unified Toolbar: search + status tabs + sort -->
      <app-list-toolbar
        placeholder="بحث برقم المبيعة، المشروع أو العميل..."
        [statusOptions]="statusOptions"
        [sortOptions]="sortOptions"
        [activeStatus]="statusFilter()"
        [activeSort]="sortBy()"
        [count]="filteredSales().length"
        [loading]="loading()"
        (searchChange)="onSearch($event)"
        (statusChange)="onStatusChange($event)"
        (sortChange)="onSortChange($event)"
      />

      <!-- Table -->
      <div class="glass-card rounded-2xl border border-sf-border shadow-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse table-compact table-sticky-header">
            <thead>
              <tr class="bg-sf-surface/50 border-b border-sf-border">
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-right">بيانات المبيعة</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-right">العميل</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-left">قيمة الوحدة</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-left">العمولة</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest text-right">الحالة</th>
                <th class="px-6 py-4 text-[11px] font-black text-sf-muted uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sf-border/50" *ngIf="!loading(); else skeleton">
              @for (sale of filteredSales(); track sale._id) {
                <tr class="group row-financial-hover cursor-pointer" [routerLink]="[sale._id]">
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-bold text-sf-text group-hover:text-sf-primary font-financial transition-colors">{{ sale.saleNumber }}</span>
                      <span class="text-xs font-medium text-sf-muted mt-0.5 font-financial">{{ sale.projectName }} • {{ sale.unitNumber }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      @if (sale.clientId) {
                        <a [routerLink]="['/clients', getClientId(sale.clientId)]" 
                           (click)="$event.stopPropagation()"
                           class="text-sm font-bold text-sf-primary hover:underline hover:text-sf-primary-hover transition-all">
                          {{ sale.clientName }}
                        </a>
                      } @else {
                        <span class="text-sm font-semibold text-sf-text">{{ sale.clientName }}</span>
                      }
                      <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ sale.source }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-left font-mono-numbers">
                    <span class="text-sm font-bold text-sf-text">{{ sale.unitValue | currencyEgp }}</span>
                  </td>
                  <td class="px-6 py-4 text-left font-mono-numbers">
                    <div class="flex flex-col items-start">
                      <span class="text-sm font-black text-sf-primary">{{ (sale.grossCommissionWithVAT || 0) | currencyEgp }}</span>
                      <span class="text-[10px] font-bold text-sf-muted font-financial">بنسبة {{ sale.contractCommissionPercentage }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <app-badge [color]="getStatusColor(sale.status)">{{ 'sale.status.' + sale.status | translate }}</app-badge>
                  </td>
                  <td class="px-6 py-4 text-left">
                    <button class="p-2 text-sf-muted hover:text-sf-primary hover:bg-sf-primary/10 rounded-lg transition-all">
                      <ng-icon name="heroEllipsisVertical"></ng-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center justify-center gap-3">
                      <div class="w-16 h-16 rounded-2xl bg-sf-elevated border border-sf-border
                                  flex items-center justify-center text-sf-subtle">
                        <ng-icon name="heroShoppingBag" class="text-2xl"></ng-icon>
                      </div>
                      <div>
                        <h3 class="text-base font-bold text-sf-text">{{ 'sale.list.no_data' | translate }}</h3>
                        <p class="text-sm text-sf-muted mt-1">
                          {{ statusFilter() !== 'all' ? ('sale.list.no_data' | translate) : ('sale.list.no_data' | translate) }}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="p-4 border-t border-sf-border/50" *ngIf="!loading()">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            [totalItems]="totalItems()"
            [limit]="limit()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>

      <ng-template #skeleton>
        <tr *ngFor="let i of [1,2,3,4,5]">
          <td colspan="6" class="px-6 py-4">
            <div class="h-12 bg-sf-surface rounded-xl skeleton"></div>
          </td>
        </tr>
      </ng-template>
    </div>
  `,
  styles: [`
    .shadow-glow-sm {
      box-shadow: 0 0 10px rgba(147, 51, 234, 0.2);
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
export class SaleListComponent {
  @Input() employeeId: string = '';
  @Input() set quarterId(value: string | null) {
    if (value) {
      this.currentPage.set(1);
      this.loadSales(value, this.employeeId);
    }
  }

  private saleService = inject(SaleService);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  currentQuarter    = this.themeService.currentQuarter;
  availableQuarters = this.themeService.availableQuarters;

  sales        = signal<Sale[]>([]);
  loading      = signal(true);
  searchQuery  = signal('');
  statusFilter = signal('all');
  sortBy       = signal('newest');

  filteredSales = computed(() => {
    let list = this.sales();
    const status = this.statusFilter();
    const sort   = this.sortBy();

    if (status !== 'all') {
      list = list.filter(s => s.status === status);
    }
    if (sort === 'oldest') {
      list = [...list].sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'highest') {
      list = [...list].sort((a, b) => (b.grossCommissionWithVAT || 0) - (a.grossCommissionWithVAT || 0));
    } else if (sort === 'lowest') {
      list = [...list].sort((a, b) => (a.grossCommissionWithVAT || 0) - (b.grossCommissionWithVAT || 0));
    }
    return list;
  });

  currentPage = signal(1);
  limit       = signal(10);
  totalItems  = signal(0);
  totalPages  = signal(1);

  readonly statusOptions = [
    { value: 'all',       label: 'الكل' },
    { value: 'draft',     label: 'مسودة' },
    { value: 'confirmed', label: 'مؤكدة' },
    { value: 'claimed',   label: 'تمت المطالبة' },
    { value: 'collected', label: 'محصلة' },
  ];
  readonly sortOptions = [
    { value: 'newest',  label: 'الأحدث' },
    { value: 'oldest',  label: 'الأقدم' },
    { value: 'highest', label: 'أعلى قيمة' },
    { value: 'lowest',  label: 'أقل قيمة' },
  ];

  constructor() {
    effect(() => { this.loadSales(this.currentQuarter(), this.employeeId); });
  }

  onQuarterChange(event: Event) {
    this.currentPage.set(1);
    this.themeService.setQuarter((event.target as HTMLSelectElement).value);
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadSales(this.currentQuarter(), this.employeeId);
  }

  onStatusChange(status: string) { this.statusFilter.set(status); }
  onSortChange(sort: string)     { this.sortBy.set(sort); }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadSales(this.currentQuarter(), this.employeeId);
  }

  loadSales(quarterId: string, employeeId?: string) {
    this.themeService.loading.set(true);
    this.loading.set(true);
    this.saleService.getSalesByQuarter(
      quarterId,
      employeeId,
      this.currentPage(),
      this.limit(),
      this.searchQuery(),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.themeService.loading.set(false);
        this.loading.set(false);
        if (res.success) {
          this.sales.set(res.data);
          if (res.pagination) {
            this.totalItems.set(res.pagination.total);
            this.totalPages.set(res.pagination.totalPages);
          }
        }
      },
      error: () => { this.themeService.loading.set(false); this.loading.set(false); },
    });
  }

  // kept for backward-compat with any template using these directly
  nextPage() { this.onPageChange(this.currentPage() + 1); }
  prevPage()  { this.onPageChange(this.currentPage() - 1); }
  getMin(a: number, b: number) { return Math.min(a, b); }

  translateStatus(status: string): string {
    switch (status) {
      case 'collected': return 'محصلة';
      case 'claimed': return 'تمت المطالبة';
      case 'confirmed': return 'مؤكدة';
      case 'draft': return 'مسودة';
      default: return status;
    }
  }

  getStatusColor(status: string): any {
    switch (status) {
      case 'collected': return 'success';
      case 'claimed': return 'info';
      case 'confirmed': return 'primary';
      default: return 'gray';
    }
  }

  formatQ(q: string) {
    return formatQuarter(q);
  }

  getClientId(client: any): string {
    if (!client) return '';
    return typeof client === 'object' ? (client._id || client.toString()) : client;
  }
}
