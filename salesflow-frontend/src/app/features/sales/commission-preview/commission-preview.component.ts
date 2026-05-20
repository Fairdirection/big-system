import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap, map } from 'rxjs';
import { SaleService } from '@core/services/sale.service';
import { EmployeeService } from '@core/services/employee.service';
import { CommissionService } from '@core/services/commission.service';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroChevronRight, heroBanknotes, heroCalculator,
  heroInformationCircle, heroExclamationTriangle, heroSparkles, heroCheckCircle
} from '@ng-icons/heroicons/outline';
import { Sale } from '@core/models/sale.model';
import { TranslateModule } from '@ngx-translate/core';

interface SellerBreakdown {
  employeeId: string;
  employeeName: string;
  seniorityLevel: string;
  sharePercentage: number;
  sellerSaleValue: number;
  commissionEarned: number;
  ratePerMillion: number;
  targetContribution: number;
  isOneThirdRule: boolean;
  incentiveAmount: number;
  managerIncentiveShare: number;
}

@Component({
  selector: 'app-commission-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIconComponent, CurrencyEgpPipe, TranslateModule],
  providers: [
    provideIcons({
      heroChevronRight, heroBanknotes, heroCalculator,
      heroInformationCircle, heroExclamationTriangle, heroSparkles, heroCheckCircle
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 text-right" dir="rtl">

      <!-- Header -->
      <header class="flex items-center gap-4">
        <button [routerLink]="saleId() ? ['/sales', saleId()] : ['/sales']"
                class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
          <ng-icon name="heroChevronRight" class="text-xl text-sf-text"></ng-icon>
        </button>
        <div>
          <h1 class="text-3xl font-display font-black text-sf-text tracking-tight flex items-center gap-3">
            <ng-icon name="heroBanknotes" class="text-sf-primary text-4xl"></ng-icon>
            معاينة العمولات والمستحقات
          </h1>
          @if (sale(); as s) {
            <p class="text-sf-muted font-medium mt-1">
              {{ s.saleNumber }} • {{ s.projectName }} • وحدة {{ s.unitNumber }}
            </p>
          }
        </div>
      </header>

      <!-- Loading -->
      @if (loading()) {
        <div class="py-24 flex flex-col items-center justify-center space-y-4">
          <div class="w-12 h-12 border-4 border-sf-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-semibold text-sf-muted">جاري حساب تفاصيل العمولات...</p>
        </div>
      }

      @if (!loading() && sale(); as s) {

        <!-- 1/3 Rule Alert -->
        @if (s.contractCommissionPercentage <= 1.9) {
          <div class="flex items-start gap-4 p-5 bg-amber-500/10 border border-amber-400/40 rounded-2xl">
            <ng-icon name="heroExclamationTriangle" class="text-amber-500 text-2xl mt-0.5 shrink-0"></ng-icon>
            <div>
              <p class="text-sm font-bold text-amber-700 dark:text-amber-400">قاعدة الثلث مطبقة على هذه المبيعة</p>
              <p class="text-xs font-medium text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                نسبة عمولة المطور ({{ s.contractCommissionPercentage }}%) أقل من أو تساوي 1.9%،
                لذلك تُحتسب ثلث قيمة الوحدة فقط في المستهدف الربعي لكل بائع.
              </p>
            </div>
          </div>
        }

        <!-- Financial Overview -->
        <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <div class="w-2 h-6 bg-sf-primary rounded-full"></div>
            <h3 class="text-lg font-display font-bold text-sf-text">الملخص المالي للصفقة</h3>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">سعر الوحدة</span>
              <p class="text-lg font-black text-sf-text font-mono">{{ s.unitValue | currencyEgp }}</p>
            </div>
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">نسبة عمولة المطور</span>
              <p class="text-lg font-black text-sf-text font-mono">{{ s.contractCommissionPercentage }}%</p>
            </div>
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">إجمالي العمولة (مع VAT)</span>
              <p class="text-lg font-black text-sf-primary font-mono">{{ s.grossCommissionWithVAT | currencyEgp }}</p>
            </div>
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">صافي إيراد الشركة</span>
              <p class="text-lg font-black text-sf-success font-mono">{{ s.netRevenue | currencyEgp }}</p>
            </div>
          </div>

          @if (s.incentivePercentage > 0) {
            <div class="flex items-center gap-3 px-4 py-3 bg-sf-primary/5 border border-sf-primary/15 rounded-2xl">
              <ng-icon name="heroSparkles" class="text-sf-primary text-lg shrink-0"></ng-icon>
              <p class="text-sm font-bold text-sf-text">
                حافز إضافي من المطور: {{ s.incentivePercentage }}% من قيمة الوحدة
                = {{ (s.incentivePercentage / 100 * s.unitValue) | currencyEgp }}
              </p>
            </div>
          }
        </section>

        <!-- Per-Seller Breakdown -->
        <section class="space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-2 h-6 bg-sf-secondary rounded-full"></div>
            <h3 class="text-lg font-display font-bold text-sf-text">مستحقات العمولة الداخلية لكل بائع</h3>
          </div>

          @if (!sellerBreakdowns().length) {
            <div class="p-12 flex flex-col items-center text-center glass-card rounded-3xl border border-sf-border">
              <ng-icon name="heroInformationCircle" class="text-sf-muted text-4xl mb-3"></ng-icon>
              <p class="text-sm font-semibold text-sf-muted">لا توجد بيانات بائعين لهذه المبيعة</p>
            </div>
          }

          @for (seller of sellerBreakdowns(); track seller.employeeId) {
            <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl">

              <!-- Seller Header -->
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-sf-border/30">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-full bg-sf-primary/10 border border-sf-primary/20 flex items-center justify-center font-black text-sf-primary">
                    {{ seller.employeeName.charAt(0) }}
                  </div>
                  <div>
                    <a [routerLink]="['/employees', seller.employeeId]"
                       class="text-sm font-black text-sf-primary hover:underline transition-all">
                      {{ seller.employeeName }}
                    </a>
                    <p class="text-[10px] font-bold text-sf-muted uppercase tracking-widest mt-0.5">
                      {{ formatRole(seller.seniorityLevel) }} • حصة {{ seller.sharePercentage }}%
                    </p>
                  </div>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-sf-muted uppercase tracking-widest mb-0.5">قيمة البيع المنسوبة</p>
                  <p class="text-lg font-black text-sf-text font-mono">{{ seller.sellerSaleValue | currencyEgp }}</p>
                </div>
              </div>

              <!-- Commission Rows -->
              <div class="space-y-3">
                <div class="flex justify-between items-center py-2 border-b border-sf-border/20">
                  <span class="text-sm font-medium text-sf-muted">معدل العمولة المطبق</span>
                  <span class="text-sm font-black text-sf-text font-mono">{{ seller.ratePerMillion | number:'1.0-0' }} ج.م / مليون</span>
                </div>

                <div class="flex justify-between items-center py-2 border-b border-sf-border/20">
                  <span class="text-sm font-medium text-sf-muted">
                    المساهمة في المستهدف الربعي
                    @if (seller.isOneThirdRule) {
                      <span class="text-[10px] font-bold text-amber-500 mr-1">(مطبق قاعدة ⅓)</span>
                    }
                  </span>
                  <span class="text-sm font-bold font-mono"
                        [class.text-amber-600]="seller.isOneThirdRule"
                        [class.text-sf-text]="!seller.isOneThirdRule">
                    {{ seller.targetContribution | currencyEgp }}
                  </span>
                </div>

                <div class="flex justify-between items-center py-3 px-4 bg-sf-primary/5 border border-sf-primary/10 rounded-2xl">
                  <span class="text-sm font-bold text-sf-text flex items-center gap-2">
                    <ng-icon name="heroCalculator" class="text-sf-primary text-base"></ng-icon>
                    العمولة الداخلية الشهرية (الحد الأدنى)
                  </span>
                  <span class="text-xl font-black text-sf-primary font-mono">{{ seller.commissionEarned | currencyEgp }}</span>
                </div>

                @if (seller.incentiveAmount > 0) {
                  <div class="pt-2 mt-1 border-t border-sf-border/20 space-y-3">
                    <div class="flex justify-between items-center py-2">
                      <span class="text-sm font-medium text-sf-muted flex items-center gap-1.5">
                        <ng-icon name="heroSparkles" class="text-sf-primary text-sm"></ng-icon>
                        حصة البائع من الحافز الإضافي
                      </span>
                      <span class="text-sm font-bold text-sf-success font-mono">+ {{ seller.incentiveAmount | currencyEgp }}</span>
                    </div>
                    @if (seller.managerIncentiveShare > 0) {
                      <div class="flex justify-between items-center py-2">
                        <span class="text-sm font-medium text-sf-muted">حصة المدير من الحافز الإضافي</span>
                        <span class="text-sm font-bold text-sf-warning font-mono">{{ seller.managerIncentiveShare | currencyEgp }}</span>
                      </div>
                    }
                    <div class="flex justify-between items-center py-3 px-4 bg-sf-success/5 border border-sf-success/15 rounded-2xl">
                      <span class="text-sm font-bold text-sf-text flex items-center gap-2">
                        <ng-icon name="heroCheckCircle" class="text-sf-success text-base"></ng-icon>
                        الإجمالي المستحق (عمولة + حافز)
                      </span>
                      <span class="text-xl font-black text-sf-success font-mono">
                        {{ (seller.commissionEarned + seller.incentiveAmount) | currencyEgp }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </section>

        <!-- Footer Note -->
        <div class="flex items-start gap-3 p-5 bg-sf-surface/50 border border-sf-border/50 rounded-2xl">
          <ng-icon name="heroInformationCircle" class="text-sf-muted text-xl mt-0.5 shrink-0"></ng-icon>
          <p class="text-xs font-medium text-sf-muted leading-relaxed">
            <strong class="text-sf-text">ملاحظة:</strong>
            المبالغ المعروضة هي الحد الأدنى للعمولة الشهرية (الشريحة الأولى). التسوية النهائية تتم ربع السنوية
            بناءً على إجمالي مبيعات الربع ونسبة تحقيق المستهدف.
            <a [routerLink]="['/commissions']" class="text-sf-primary font-bold hover:underline mr-1">عرض لوحة العمولات الكاملة →</a>
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class CommissionPreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private saleService = inject(SaleService);
  private employeeService = inject(EmployeeService);
  private commissionService = inject(CommissionService);

  sale = signal<Sale | null>(null);
  saleId = signal<string | null>(null);
  sellerBreakdowns = signal<SellerBreakdown[]>([]);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.saleId.set(id);
    this.loadData(id);
  }

  private loadData(saleId: string) {
    this.saleService.getSale(saleId).pipe(
      switchMap(res => {
        if (!res.success || !res.data) return of({ sale: null as Sale | null, breakdowns: [] as SellerBreakdown[] });
        const sale = res.data;
        if (!sale.sellers?.length) return of({ sale, breakdowns: [] as SellerBreakdown[] });

        const empCalls = sale.sellers.map(s => this.employeeService.getEmployee(s.employeeId));

        return (empCalls.length ? forkJoin(empCalls) : of([])).pipe(
          switchMap(empResponses => {
            const simCalls = sale.sellers.map((seller, idx) => {
              const seniority = (empResponses as any[])[idx]?.data?.seniorityLevel || 'Fresh';
              const sellerSaleValue = (seller.sharePercentage / 100) * sale.unitValue;
              const { incentiveAmount, managerIncentiveShare } = this.calcIncentiveSplit(sale.incentivePercentage, sellerSaleValue);

              return this.commissionService.simulateCommission({
                role: seniority,
                salesAmount: sellerSaleValue,
                developerRate: sale.contractCommissionPercentage,
                saleSource: sale.isPrivateSource ? 'Personal' : 'Company',
                quarterTotal: 0
              }).pipe(
                map(simRes => ({
                  employeeId: seller.employeeId,
                  employeeName: seller.employeeName || '',
                  seniorityLevel: seniority,
                  sharePercentage: seller.sharePercentage,
                  sellerSaleValue,
                  commissionEarned: simRes.data?.commissionEarned || 0,
                  ratePerMillion: simRes.data?.ratePerMillion || 0,
                  targetContribution: simRes.data?.targetContribution || 0,
                  isOneThirdRule: simRes.data?.isOneThirdRule || false,
                  incentiveAmount,
                  managerIncentiveShare
                } as SellerBreakdown))
              );
            });

            return (simCalls.length ? forkJoin(simCalls) : of([])).pipe(
              map(breakdowns => ({ sale, breakdowns: breakdowns as SellerBreakdown[] }))
            );
          })
        );
      })
    ).subscribe({
      next: ({ sale, breakdowns }) => {
        this.sale.set(sale);
        this.sellerBreakdowns.set(breakdowns);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private calcIncentiveSplit(incentivePercentage: number, sellerSaleValue: number): { incentiveAmount: number; managerIncentiveShare: number } {
    if (!incentivePercentage || incentivePercentage <= 0) return { incentiveAmount: 0, managerIncentiveShare: 0 };
    const total = (incentivePercentage / 100) * sellerSaleValue;
    if (incentivePercentage < 1.5) return { incentiveAmount: Math.round(total), managerIncentiveShare: 0 };
    const mgr = ((incentivePercentage < 3.0 ? 0.5 : 1.0) / 100) * sellerSaleValue;
    return { incentiveAmount: Math.round(total - mgr), managerIncentiveShare: Math.round(mgr) };
  }

  formatRole(level: string): string {
    const map: Record<string, string> = {
      Fresh: 'موظف جديد', BA: 'مستشار عقاري', BC: 'خبير عقاري',
      Senior: 'أخصائي مبيعات', SV: 'مشرف مبيعات', TeamLeader: 'قائد فريق'
    };
    return map[level] || level;
  }
}
