import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleService } from '@core/services/sale.service';
import { ThemeService } from '@core/services/theme.service';
import { Sale } from '@core/models/sale.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroMagnifyingGlass, heroFunnel, heroChevronRight, heroEllipsisVertical, heroShoppingBag } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';
import { formatQuarter } from '@core/utils/quarter.utils';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ heroPlus, heroMagnifyingGlass, heroFunnel, heroChevronRight, heroEllipsisVertical, heroShoppingBag })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">تتبع المبيعات</h1>
          <p class="text-sf-muted font-medium mt-1">إدارة وتتبع جميع المبيعات المؤكدة والعمولات للربع الحالي.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2 shadow-glow-sm">
          <ng-icon name="heroPlus"></ng-icon>
          <span>مبيعة جديدة</span>
        </button>
      </header>

      <!-- Filters & Search -->
      <div class="flex flex-col md:flex-row items-center gap-4 bg-sf-surface/50 p-4 rounded-2xl border border-sf-border shadow-xl backdrop-blur-md">
        <div class="relative flex-1 w-full group">
          <ng-icon name="heroMagnifyingGlass" class="absolute right-4 top-1/2 -translate-y-1/2 text-sf-muted group-focus-within:text-sf-primary transition-colors"></ng-icon>
          <input type="text" (input)="onSearch($event)" placeholder="بحث برقم المبيعة، المشروع أو العميل..." 
                 class="w-full pr-11 pl-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 transition-all outline-none">
          <p class="absolute -bottom-5 right-2 text-[10px] text-sf-muted opacity-0 group-focus-within:opacity-100 transition-opacity">ابحث برقم الوحدة أو اسم المشروع للوصول للمبيعة المطلوبة.</p>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <select [value]="currentQuarter()" (change)="onQuarterChange($event)" 
                  class="px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm font-bold text-sf-text focus:ring-2 focus:ring-sf-primary/50 outline-none w-full md:w-56 cursor-pointer">
            @for (q of availableQuarters(); track q) {
              <option [value]="q">{{ formatQ(q) }}</option>
            }
          </select>
        </div>
      </div>

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
                    <app-badge [color]="getStatusColor(sale.status)">{{ translateStatus(sale.status) }}</app-badge>
                  </td>
                  <td class="px-6 py-4 text-left">
                    <button class="p-2 text-sf-muted hover:text-sf-primary hover:bg-sf-primary/10 rounded-lg transition-all">
                      <ng-icon name="heroEllipsisVertical"></ng-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-24 text-center">
                    <div class="flex flex-col items-center justify-center opacity-40">
                      <div class="w-16 h-16 rounded-full bg-sf-bg flex items-center justify-center mb-4 border border-sf-border shadow-inner">
                        <ng-icon name="heroShoppingBag" class="text-2xl"></ng-icon>
                      </div>
                      <h3 class="text-lg font-bold">لم يتم العثور على مبيعات</h3>
                      <p class="text-sm">تأكد من اختيار الربع الصحيح أو حاول البحث بكلمة أخرى.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="px-6 py-4 bg-sf-surface/20 border-t border-sf-border flex items-center justify-between" *ngIf="totalPages() > 1 && !loading()">
          <span class="text-xs font-bold text-sf-muted uppercase tracking-widest font-financial">
            عرض {{ (currentPage() - 1) * limit() + 1 }} - {{ getMin(currentPage() * limit(), totalItems()) }} من أصل {{ totalItems() }} مبيعة
          </span>
          <div class="flex items-center gap-2">
            <button (click)="prevPage()" 
                    [disabled]="currentPage() === 1"
                    class="p-2 bg-sf-bg border border-sf-border rounded-lg disabled:opacity-30 disabled:hover:text-sf-muted transition-all flex items-center justify-center active:scale-95 cursor-pointer">
              <ng-icon name="heroChevronRight" class="rotate-180"></ng-icon>
            </button>
            <span class="px-3 py-1 bg-sf-primary/10 border border-sf-primary/20 rounded-lg text-xs font-black text-sf-primary font-financial">
              الصفحة {{ currentPage() }} من {{ totalPages() }}
            </span>
            <button (click)="nextPage()" 
                    [disabled]="currentPage() === totalPages()"
                    class="p-2 bg-sf-bg border border-sf-border rounded-lg disabled:opacity-30 disabled:hover:text-sf-muted transition-all flex items-center justify-center active:scale-95 cursor-pointer">
              <ng-icon name="heroChevronRight"></ng-icon>
            </button>
          </div>
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

  currentQuarter = this.themeService.currentQuarter;
  availableQuarters = this.themeService.availableQuarters;
  
  sales = signal<Sale[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  
  // Computed Signal to bind directly to sales (backward-compatible)
  filteredSales = computed(() => this.sales());

  // Pagination Signals
  currentPage = signal(1);
  limit = signal(10);
  totalItems = signal(0);
  totalPages = signal(1);

  constructor() {
    effect(() => {
      this.loadSales(this.currentQuarter(), this.employeeId);
    });
  }

  onQuarterChange(event: any) {
    this.currentPage.set(1);
    this.themeService.setQuarter(event.target.value);
  }

  loadSales(quarterId: string, employeeId?: string) {
    this.themeService.loading.set(true);
    this.loading.set(true); // local skeleton
    this.saleService.getSalesByQuarter(
      quarterId, 
      employeeId, 
      this.currentPage(), 
      this.limit(), 
      this.searchQuery()
    ).subscribe({
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
      error: () => {
        this.themeService.loading.set(false);
        this.loading.set(false);
      }
    });
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    this.currentPage.set(1); // Go back to first page when search changes
    this.loadSales(this.currentQuarter(), this.employeeId);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p: number) => p + 1);
      this.loadSales(this.currentQuarter(), this.employeeId);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p: number) => p - 1);
      this.loadSales(this.currentQuarter(), this.employeeId);
    }
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

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
