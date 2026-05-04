import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SaleService } from '@core/services/sale.service';
import { ClaimService } from '@core/services/claim.service';
import { Sale } from '@core/models/sale.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronRight, heroChevronLeft, heroCheckBadge, heroPencilSquare, heroPrinter, heroDocumentDuplicate } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ heroChevronRight, heroCheckBadge, heroPencilSquare, heroPrinter, heroDocumentDuplicate })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sale(); as s) {
      <div class="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
        <!-- Header -->
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <button [routerLink]="['/sales']" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
              <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
            </button>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">{{ s.saleNumber }}</h1>
                <app-badge [color]="getStatusColor(s.status || '')">{{ translateStatus(s.status || '') }}</app-badge>
              </div>
              <p class="text-sf-muted font-medium mt-1">{{ s.projectName }} • وحدة {{ s.unitNumber }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            @if (s.status === 'draft') {
              <button (click)="confirmSale()" 
                      class="btn btn-success px-6 py-2 flex items-center gap-2">
                <ng-icon name="heroCheckBadge"></ng-icon>
                <span>تأكيد البيعة</span>
              </button>
            } @else if (s.status === 'confirmed') {
              <button (click)="createClaim()" 
                      class="btn btn-info px-6 py-2 flex items-center gap-2">
                <ng-icon name="heroDocumentDuplicate"></ng-icon>
                <span>مطالبة بالعمولة</span>
              </button>
            }
            <button class="btn btn-secondary px-5 py-2 flex items-center gap-2">
              <ng-icon name="heroPrinter"></ng-icon>
              <span>طباعة الإيصال</span>
            </button>
            <button [routerLink]="['/sales', s._id, 'edit']" class="btn btn-primary px-6 py-2 flex items-center gap-2">
              <ng-icon name="heroPencilSquare"></ng-icon>
              <span>تعديل المبيعة</span>
            </button>
          </div>
        </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Details -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Property Information -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-primary rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">بيانات الوحدة العقارية</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-right">
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">المطور / المشروع</span>
                <p class="text-sm font-semibold text-sf-text">{{ sale()?.projectName }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">مواصفات الوحدة</span>
                <p class="text-sm font-semibold text-sf-text">{{ sale()?.unitType }} ({{ sale()?.unitNumber }})</p>
              </div>
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">تاريخ التعاقد</span>
                <p class="text-sm font-semibold text-sf-text">{{ sale()?.contractDate | date:'longDate' }}</p>
              </div>
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">مصدر المبيعة</span>
                <p class="text-sm font-semibold text-sf-text">{{ sale()?.source }}</p>
              </div>
            </div>
          </section>

          <!-- Commission Calculation -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-secondary rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">التفاصيل المالية والعمولات</h3>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-sf-border/20">
                <span class="text-sm font-medium text-sf-muted">سعر التعاقد للوحدة</span>
                <span class="text-sm font-black text-sf-text">{{ sale()?.unitValue | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-sf-border/20">
                <span class="text-sm font-medium text-sf-muted">نسبة العمولة المتفق عليها</span>
                <span class="text-sm font-black text-sf-text">{{ sale()?.contractCommissionPercentage }}%</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-sf-border/20">
                <span class="text-sm font-medium text-sf-muted">إجمالي العمولة (شامل القيمة المضافة)</span>
                <span class="text-lg font-black text-sf-primary">{{ sale()?.grossCommissionWithVAT | currencyEgp }}</span>
              </div>
              <div class="flex justify-between items-center py-3 px-4 bg-sf-bg rounded-xl mt-4">
                <span class="text-xs font-bold text-sf-muted uppercase tracking-widest">صافي ربح الشركة (Revenue)</span>
                <span class="text-xl font-display font-black text-sf-success">{{ sale()?.netRevenue | currencyEgp }}</span>
              </div>
            </div>
          </section>

          <!-- Sellers Split -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-info rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">توزيع العمولات على فريق البيع</h3>
            </div>

            <div class="space-y-4">
              @for (seller of sale()?.sellers; track seller.employeeId) {
                <div class="flex items-center justify-between p-4 bg-sf-bg/50 rounded-2xl border border-sf-border">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-sf-surface border border-sf-border flex items-center justify-center font-bold text-sf-primary">
                      {{ seller.employeeName?.charAt(0) }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-sf-text">{{ seller.employeeName }}</p>
                      <p class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">نسبة المشاركة: {{ seller.sharePercentage }}%</p>
                    </div>
                  </div>
                  <div class="text-left">
                    <p class="text-xs font-bold text-sf-muted uppercase mb-0.5">العمولة المستحقة</p>
                    <p class="text-sm font-black text-sf-text">{{ seller.commissionValue | currencyEgp }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>

        <!-- Sidebar / Client -->
        <div class="space-y-8">
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6 sticky top-8">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-success rounded-full"></div>
              <h3 class="text-lg font-display font-bold text-sf-text">بيانات العميل</h3>
            </div>

            <div class="flex flex-col items-center py-4">
              <div class="w-20 h-20 rounded-pill bg-sf-bg border border-sf-border flex items-center justify-center text-sf-primary text-3xl mb-4 shadow-inner">
                <ng-icon name="heroDocumentDuplicate"></ng-icon>
              </div>
              <h4 class="text-xl font-display font-black text-sf-text">{{ sale()?.clientName }}</h4>
              <p class="text-xs font-bold text-sf-muted uppercase tracking-widest mt-1">عميل مباشر</p>
            </div>

            <div class="pt-6 border-t border-sf-border/30 space-y-4">
              <button class="w-full btn btn-secondary text-sm font-bold flex items-center justify-center gap-2">
                <span>عرض الملف الشخصي</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    .glass-card { background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(12px); }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class SaleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private saleService = inject(SaleService);
  private claimService = inject(ClaimService);
  private router = inject(Router);
  sale = signal<Sale | null>(null);

  ngOnInit() {
    this.loadSale();
  }

  loadSale() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.saleService.getSale(id).subscribe(res => {
        if (res.success) {
          this.sale.set(res.data);
        }
      });
    }
  }

  confirmSale() {
    const s = this.sale();
    if (!s) return;
    
    this.saleService.confirmSale(s._id).subscribe(res => {
      if (res.success) {
        this.loadSale();
      }
    });
  }

  createClaim() {
    const s = this.sale();
    if (!s) return;
    
    this.claimService.createClaim({ saleId: s._id }).subscribe(res => {
      if (res.success) {
        this.router.navigate(['/claims']);
      }
    });
  }

  getStatusColor(status: string): any {
    switch (status) {
      case 'collected': return 'success';
      case 'claimed': return 'info';
      case 'confirmed': return 'primary';
      default: return 'gray';
    }
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
}
