import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommissionService, CommissionProgress } from '@core/services/commission.service';
import { EmployeeService } from '@core/services/employee.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { ThemeService } from '@core/services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroBanknotes, heroCalculator, heroArrowPath, heroFunnel, heroUser, 
  heroCalendarDays, heroArrowDownTray, heroSparkles, heroListBullet,
  heroCheckCircle, heroExclamationTriangle, heroInformationCircle,
  heroCheck, heroClock, heroScale
} from '@ng-icons/heroicons/outline';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIconComponent, TranslateModule],
  providers: [
    provideIcons({
      heroBanknotes, heroCalculator, heroArrowPath, heroFunnel, heroUser,
      heroCalendarDays, heroArrowDownTray, heroSparkles, heroListBullet,
      heroCheckCircle, heroExclamationTriangle, heroInformationCircle,
      heroCheck, heroClock, heroScale
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in pb-20 text-right" dir="rtl">
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-sf-border/20">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight flex items-center gap-3">
            <ng-icon name="heroBanknotes" class="text-sf-primary text-4xl"></ng-icon>
            {{ 'commission.title' | translate }}
          </h1>
          <p class="text-sf-muted font-medium mt-1">
            {{ 'commission.subtitle' | translate }}
          </p>
        </div>

        <!-- Global Selectors (Filters) -->
        <div class="flex flex-wrap items-center gap-4 bg-sf-surface p-3 border border-sf-border rounded-[2rem] shadow-inner">
          <!-- Employee Selector -->
          <div class="flex items-center gap-2">
            <ng-icon name="heroUser" class="text-sf-primary text-lg"></ng-icon>
            <select [disabled]="isSalesRole()" [value]="selectedEmployeeId()" (change)="onEmployeeChange($event)"
                    class="px-4 py-2 bg-sf-bg border border-sf-border rounded-2xl text-xs font-bold focus:ring-2 focus:ring-sf-primary outline-none transition-all text-sf-text max-w-[200px]">
              @for (emp of salesEmployees(); track emp._id) {
                <option [value]="emp._id">{{ emp.name }} ({{ formatRole(emp.seniorityLevel) }})</option>
              }
            </select>
          </div>

          <div class="h-6 w-px bg-sf-border/60"></div>

          <!-- Quarter Selector -->
          <div class="flex items-center gap-2">
            <ng-icon name="heroCalendarDays" class="text-sf-primary text-lg"></ng-icon>
            <select [value]="selectedQuarterId()" (change)="onQuarterChange($event)"
                    class="px-4 py-2 bg-sf-bg border border-sf-border rounded-2xl text-xs font-bold focus:ring-2 focus:ring-sf-primary outline-none transition-all text-sf-text">
              @for (q of themeService.availableQuarters(); track q) {
                <option [value]="q">{{ formatQ(q) }}</option>
              }
            </select>
          </div>

          <!-- Refresh Button -->
          <button (click)="loadCommissionData()" class="p-2 hover:bg-sf-primary/10 rounded-xl text-sf-muted hover:text-sf-primary transition-all">
            <ng-icon name="heroArrowPath" [class.animate-spin]="loading()"></ng-icon>
          </button>
        </div>
      </header>

      <!-- Loading Skeleton -->
      <div *ngIf="loading()" class="space-y-8 animate-pulse" aria-hidden="true">
        <!-- KPI Card Skeletons -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl space-y-4">
              <div class="flex items-center justify-between">
                <div class="h-3 w-28 bg-sf-border/50 rounded-full"></div>
                <div class="w-8 h-8 rounded-xl bg-sf-border/40"></div>
              </div>
              <div class="space-y-2">
                <div class="h-7 w-40 bg-sf-border/50 rounded-full"></div>
                <div class="h-2.5 w-52 bg-sf-border/30 rounded-full"></div>
              </div>
            </div>
          }
        </div>
        <!-- Tab Bar Skeleton -->
        <div class="flex gap-2">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-9 w-28 bg-sf-border/40 rounded-2xl"></div>
          }
        </div>
        <!-- Content Row Skeletons -->
        <div class="glass-card rounded-3xl border border-sf-border p-6 space-y-4">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="flex items-center justify-between py-3 border-b border-sf-border/20 last:border-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-sf-border/40"></div>
                <div class="space-y-1.5">
                  <div class="h-3 w-36 bg-sf-border/50 rounded-full"></div>
                  <div class="h-2.5 w-24 bg-sf-border/30 rounded-full"></div>
                </div>
              </div>
              <div class="h-4 w-20 bg-sf-border/40 rounded-full"></div>
            </div>
          }
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div *ngIf="!loading() && data()" class="space-y-8 animate-fade-in">
        <!-- KPI Metrics Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Adjusted Target Card -->
          <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl space-y-3 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-sf-primary/5 rounded-full blur-xl group-hover:bg-sf-primary/10 transition-all"></div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-sf-muted">{{ 'commission.adjusted_target' | translate }}</span>
              <div class="w-8 h-8 rounded-xl bg-sf-primary/10 text-sf-primary flex items-center justify-center"><ng-icon name="heroScale"></ng-icon></div>
            </div>
            <div class="space-y-1">
              <h3 class="text-2xl font-black text-sf-text font-mono">{{ formatCurrency(data()?.adjustedTarget || 0) }}</h3>
              <p class="text-[10px] text-sf-muted font-semibold">
                المستهدف الأصلي: {{ formatCurrency(data()?.fullTarget || 0) }} (أيام العمل: {{ data()?.actualWorkingDays }}/90 يوم)
              </p>
            </div>
          </div>

          <!-- Achieved Sales Card -->
          <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl space-y-3 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-sf-success/5 rounded-full blur-xl group-hover:bg-sf-success/10 transition-all"></div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-sf-muted">{{ 'commission.achieved_sales' | translate }}</span>
              <div class="w-8 h-8 rounded-xl bg-sf-success/10 text-sf-success flex items-center justify-center"><ng-icon name="heroCheckCircle"></ng-icon></div>
            </div>
            <div class="space-y-1">
              <h3 class="text-2xl font-black text-sf-text font-mono">{{ formatCurrency(data()?.achievedSalesValue || 0) }}</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-sf-success">{{ data()?.achievementPercentage?.toFixed(1) }}%</span>
                <span class="text-[10px] text-sf-muted font-semibold">نسبة تحقيق الترجت</span>
              </div>
            </div>
          </div>

          <!-- Earned Allowance Slab Card -->
          <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl space-y-3 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-sf-info/5 rounded-full blur-xl group-hover:bg-sf-info/10 transition-all"></div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-sf-muted">{{ 'commission.tier_label' | translate }}</span>
              <div class="w-8 h-8 rounded-xl bg-sf-info/10 text-sf-info flex items-center justify-center"><ng-icon name="heroSparkles"></ng-icon></div>
            </div>
            <div class="space-y-1">
              <h3 class="text-xl font-black text-sf-text">
                {{ formatSlabTier(data()?.achievementPercentage || 0, data()?.seniorityLevel || '') }}
              </h3>
              <p class="text-[10px] text-sf-muted font-semibold">
                علاوة مبيعات الشركة: {{ formatNumber(data()?.companyRatePerMillion || 0) }} جنيه / المليون
              </p>
            </div>
          </div>

          <!-- Net Settlement Card -->
          <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl space-y-3 relative overflow-hidden group">
            <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-sf-warning/5 rounded-full blur-xl group-hover:bg-sf-warning/10 transition-all"></div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-sf-muted">{{ 'commission.settlement_title' | translate }}</span>
              <div class="w-8 h-8 rounded-xl bg-sf-warning/10 text-sf-warning flex items-center justify-center"><ng-icon name="heroCalculator"></ng-icon></div>
            </div>
            <div class="space-y-1">
              <h3 class="text-2xl font-black font-mono"
                  [class]="(data()?.settlementDifference || 0) >= 0 ? 'text-sf-success' : 'text-sf-danger'">
                {{ ((data()?.settlementDifference || 0) >= 0 ? '+' : '') + formatCurrency(data()?.settlementDifference || 0) }}
              </h3>
              <p class="text-[10px] text-sf-muted font-semibold">
                مستحق ربعي نهائي: {{ formatCurrency(data()?.totalCommissionsEarnedFinal || 0) }}
              </p>
            </div>
          </div>

        </div>

        <!-- Segmented Tab Controls -->
        <div class="flex lg:flex-row flex-col gap-8">
          <!-- Sidebar tabs -->
          <div class="lg:w-1/4 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none border-b border-sf-border/30 lg:border-b-0">
            <button (click)="activeTab.set('board')"
                    [class]="activeTab() === 'board' ? 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all whitespace-nowrap shadow-sm' : 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all whitespace-nowrap border border-transparent'">
              <ng-icon name="heroListBullet" class="text-lg"></ng-icon>
              {{ 'commission.tab_board' | translate }}
            </button>

            <button (click)="activeTab.set('payouts')"
                    [class]="activeTab() === 'payouts' ? 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all whitespace-nowrap shadow-sm' : 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all whitespace-nowrap border border-transparent'">
              <ng-icon name="heroClock" class="text-lg"></ng-icon>
              {{ 'commission.tab_payouts' | translate }}
            </button>

            <button (click)="activeTab.set('settlement')"
                    [class]="activeTab() === 'settlement' ? 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all whitespace-nowrap shadow-sm' : 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all whitespace-nowrap border border-transparent'">
              <ng-icon name="heroCalculator" class="text-lg"></ng-icon>
              {{ 'commission.tab_settlement' | translate }}
            </button>

            <button (click)="activeTab.set('simulator')"
                    [class]="activeTab() === 'simulator' ? 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-sf-primary/10 text-sf-primary border border-sf-primary/20 text-sm font-bold transition-all whitespace-nowrap shadow-sm' : 
                    'w-full flex items-center gap-3 px-5 py-4 rounded-2xl hover:bg-sf-surface text-sf-muted hover:text-sf-text text-sm font-bold transition-all whitespace-nowrap border border-transparent'">
              <ng-icon name="heroSparkles" class="text-lg"></ng-icon>
              {{ 'commission.tab_simulator' | translate }}
            </button>
          </div>

          <!-- Content viewpane -->
          <div class="lg:w-3/4 space-y-6">
            
            <!-- TAB 1: BOARD (Closed Sales & Target Weighted Progress) -->
            <div *ngIf="activeTab() === 'board'" class="space-y-6 animate-fade-in">
              <!-- Achievement Progress Bar -->
              <div class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-display font-bold text-sf-text">تقدم المستهدف للربع المالي</h3>
                  <span class="text-sm font-black text-sf-primary font-mono">
                    {{ data()?.achievedSalesValue | currency:'EGP':'symbol-narrow':'1.0-0' }} / 
                    {{ data()?.adjustedTarget | currency:'EGP':'symbol-narrow':'1.0-0' }}
                  </span>
                </div>
                
                <!-- Progress Line -->
                <div class="relative w-full h-4 bg-sf-bg border border-sf-border rounded-full overflow-hidden shadow-inner">
                  <div class="h-full bg-gradient-to-l from-sf-primary to-purple-500 rounded-full transition-all duration-1000"
                       [style.width.%]="mathMin(data()?.achievementPercentage || 0, 100)"></div>
                </div>

                <!-- Benchmarks info -->
                <div class="flex items-center justify-between text-[10px] font-bold text-sf-muted uppercase tracking-wider">
                  <span>0%</span>
                  <span>50% (بداية فئة العلاوة 1)</span>
                  <span>75% (بداية فئة العلاوة 2)</span>
                  <span>100% (المستهدف بالكامل)</span>
                </div>
              </div>

              <!-- List of Sales under this quarter -->
              <div class="glass-card rounded-3xl border border-sf-border shadow-2xl overflow-hidden">
                <div class="p-6 border-b border-sf-border/30 flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text">مبيعات الموظف المغلقة</h3>
                    <p class="text-xs text-sf-muted mt-1">جدول بالمبيعات وقيمة العمولات الشهرية المدفوعة والوزن النسبي المحتسب للمستهدف.</p>
                  </div>
                  <span class="text-xs font-bold bg-sf-primary/5 text-sf-primary px-3 py-1.5 rounded-xl border border-sf-primary/10">
                    عدد الصفقات: {{ data()?.sales?.length || 0 }}
                  </span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-right border-collapse">
                    <thead>
                      <tr class="bg-sf-surface border-b border-sf-border/30 text-sf-muted text-xs font-black uppercase tracking-wider">
                        <th class="p-4 pr-6">العقار / العميل</th>
                        <th class="p-4">قيمة الصفقة (EGP)</th>
                        <th class="p-4">عمولة المطور (%)</th>
                        <th class="p-4">نوع المبيعات / المصدر</th>
                        <th class="p-4">وزن الترجت المحتسب</th>
                        <th class="p-4">العلاوة الشهرية (EGP)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-sf-border/20 text-sm font-medium text-sf-text">
                      @for (sale of data()?.sales; track sale.saleId) {
                        <tr class="hover:bg-sf-surface/50 transition-all">
                          <!-- Property and client info -->
                          <td class="p-4 pr-6">
                            <div class="space-y-0.5">
                              <span class="font-bold text-sf-text block">{{ sale.unitNumber || 'وحدة عقارية' }}</span>
                              <span class="text-[10px] text-sf-muted block font-semibold">
                                {{ sale.projectName }} - العميل: {{ sale.clientName || 'عميل مبيعات' }}
                              </span>
                            </div>
                          </td>
                          <!-- Deal Value (employee's share) -->
                          <td class="p-4 font-mono font-bold">{{ formatNumber(sale.sellerSaleValueRaw || 0) }} EGP</td>
                          <!-- Developer Rate -->
                          <td class="p-4">
                            <div class="flex items-center gap-1">
                              <span class="font-mono font-bold">{{ sale.developerCommissionRate?.toFixed(2) }}%</span>
                              <span *ngIf="sale.developerCommissionRate <= 1.9"
                                    class="text-[9px] font-black bg-sf-danger/10 text-sf-danger border border-sf-danger/20 px-1.5 py-0.5 rounded-md">
                                قانون 1/3
                              </span>
                            </div>
                          </td>
                          <!-- Sale Source / Type -->
                          <td class="p-4">
                            <div class="space-y-1">
                              <span class="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                                    [class]="sale.developerCommissionRate >= 3.0 ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-sf-primary/10 text-sf-primary border-sf-primary/20'">
                                {{ sale.developerCommissionRate >= 3.0 ? 'شخصي' : 'شركة' }}
                              </span>
                              <span *ngIf="sale.isPrivateSource"
                                    class="text-[10px] font-black bg-sf-info/10 text-sf-info border border-sf-info/20 px-1.5 py-0.5 rounded-md block w-max mt-1">
                                إحالة Referral
                              </span>
                            </div>
                          </td>
                          <!-- Target Weight -->
                          <td class="p-4">
                            <div class="space-y-0.5">
                              <span class="font-mono font-bold">{{ formatNumber(sale.sellerSaleValueForTarget || 0) }} EGP</span>
                              <span class="text-[10px] text-sf-muted block font-semibold" *ngIf="sale.developerCommissionRate <= 1.9">
                                (تم تخفيض 1/3 لان النسبة &le; 1.9%)
                              </span>
                            </div>
                          </td>
                          <!-- Base Payout -->
                          <td class="p-4 font-mono font-bold text-sf-primary">
                            {{ formatNumber(sale.monthlyPayout || 0) }} EGP
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="6" class="py-12 text-center text-sf-muted">
                            <ng-icon name="heroInboxStack" class="text-3xl opacity-30 mb-2"></ng-icon>
                            <p class="text-xs font-semibold">لا توجد صفقات مغلقة للربع الحالي.</p>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- TAB 2: PAYOUTS SCHEDULE -->
            <div *ngIf="activeTab() === 'payouts'" class="space-y-6 animate-fade-in">
              <div class="glass-card rounded-3xl border border-sf-border shadow-2xl overflow-hidden">
                <div class="p-6 border-b border-sf-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text">جدول استحقاقات الصرف الشهري</h3>
                    <p class="text-xs text-sf-muted mt-1">تواريخ صرف الدفعات الشهرية المحصلة وحالة الدفع الحالية.</p>
                  </div>
                  <!-- Admin toggle status control -->
                  <div *ngIf="isAdminOrManager()" class="flex items-center gap-2">
                    <span class="text-xs text-sf-muted font-bold">تحديث سريع للحالة:</span>
                    <button (click)="bulkUpdatePayoutStatus('paid')" class="text-xs font-black text-sf-success bg-sf-success/10 hover:bg-sf-success/20 px-3 py-2 rounded-xl transition-all border border-sf-success/20">
                      تأكيد الصرف بالكامل
                    </button>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-right border-collapse">
                    <thead>
                      <tr class="bg-sf-surface border-b border-sf-border/30 text-sf-muted text-xs font-black uppercase tracking-wider">
                        <th class="p-4 pr-6">رقم الصفقة (عقار)</th>
                        <th class="p-4">تاريخ التحصيل</th>
                        <th class="p-4">دورة الصرف المستهدفة</th>
                        <th class="p-4">تاريخ الصرف المقرر</th>
                        <th class="p-4">المبلغ المستحق (EGP)</th>
                        <th class="p-4">حالة الدفع</th>
                        <th class="p-4 pl-6" *ngIf="isAdminOrManager()">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-sf-border/20 text-sm font-medium text-sf-text">
                      @for (payout of data()?.payouts; track payout._id) {
                        <tr class="hover:bg-sf-surface/50 transition-all">
                          <!-- Sale number -->
                          <td class="p-4 pr-6 font-bold">{{ payout.saleNumber || 'صفقة' }}</td>
                          <!-- Collection Date -->
                          <td class="p-4 font-mono font-bold">{{ formatDate(payout.collectedAt) }}</td>
                          <!-- Cycle A / B -->
                          <td class="p-4">
                            <span class="text-xs font-bold px-2 py-0.5 rounded-md border"
                                  [class]="payout.payoutCycle === 'Cycle A' ? 'bg-sf-primary/10 text-sf-primary border-sf-primary/20' : 'bg-sf-info/10 text-sf-info border-sf-info/20'">
                              {{ payout.payoutCycle === 'Cycle A' ? 'دورة A (20 الشهر)' : 'دورة B (10 التالي)' }}
                            </span>
                          </td>
                          <!-- Scheduled Payout Date -->
                          <td class="p-4 font-mono font-bold text-sf-muted">{{ formatDate(payout.payoutDate) }}</td>
                          <!-- Amount -->
                          <td class="p-4 font-mono font-bold text-sf-primary">{{ formatNumber(payout.grossAmount || 0) }} EGP</td>
                          <!-- Status badge -->
                          <td class="p-4">
                            <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                  [class]="payout.status === 'paid' ? 'bg-sf-success/15 text-sf-success' : 'bg-sf-warning/15 text-sf-warning'">
                              {{ payout.status === 'paid' ? 'تم الصرف' : 'معلق بقائمة الصرف' }}
                            </span>
                          </td>
                          <!-- Quick Toggle action for admins -->
                          <td class="p-4 pl-6" *ngIf="isAdminOrManager()">
                            <button (click)="togglePayoutStatus(payout)"
                                    class="text-xs font-bold px-3 py-1 bg-sf-surface hover:bg-sf-bg border border-sf-border hover:border-sf-primary rounded-xl transition-all">
                              {{ payout.status === 'paid' ? 'جعله معلقاً' : 'تأكيد الصرف' }}
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="7" class="py-12 text-center text-sf-muted">
                            <ng-icon name="heroClock" class="text-3xl opacity-30 mb-2"></ng-icon>
                            <p class="text-xs font-semibold">لا توجد مستحقات صرف شهرية مجدولة بعد.</p>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- TAB 3: QUARTERLY SETTLEMENT -->
            <div *ngIf="activeTab() === 'settlement'" class="space-y-6 animate-fade-in">
              <!-- Audit settlement visualization panel -->
              <div class="glass-card p-6 sm:p-8 rounded-[2rem] border border-sf-border shadow-2xl space-y-6">
                <div>
                  <h3 class="text-xl font-display font-bold text-sf-text">محرك تدقيق وتعديل العمولات</h3>
                  <p class="text-xs text-sf-muted mt-1">يتم الصرف شهرياً بالحد الأدنى للفئة، وعند نهاية الربع المالي تتم تسوية جميع المبيعات بناء على النسبة الفعلية المحققة.</p>
                </div>

                <!-- Comparison grid breakdown -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <!-- Total Earned Final -->
                  <div class="p-5 bg-sf-bg rounded-2xl border border-sf-border space-y-2">
                    <span class="text-xs font-bold text-sf-muted">إجمالي العمولة الفعلية المستحقة (نهائي)</span>
                    <h4 class="text-xl font-black text-sf-text font-mono">{{ formatCurrency(data()?.totalCommissionsEarnedFinal || 0) }}</h4>
                    <p class="text-[10px] text-sf-muted font-semibold">احتساب المبيعات بالفئة الفعلية المكتسبة.</p>
                  </div>

                  <!-- Total Paid Monthly -->
                  <div class="p-5 bg-sf-bg rounded-2xl border border-sf-border space-y-2">
                    <span class="text-xs font-bold text-sf-muted">إجمالي المدفوعات الشهرية (الحدود الدنيا)</span>
                    <h4 class="text-xl font-black text-sf-text font-mono text-sf-primary">{{ formatCurrency(data()?.totalCommissionsPaidMonthly || 0) }}</h4>
                    <p class="text-[10px] text-sf-muted font-semibold">العلاوات المصروفة كحد أدنى بمجرد التحصيل.</p>
                  </div>

                  <!-- Net Settlement Difference -->
                  <div class="p-5 rounded-2xl border space-y-2"
                       [class]="(data()?.settlementDifference || 0) >= 0 ? 'bg-sf-success/5 border-sf-success/20' : 'bg-sf-danger/5 border-sf-danger/20'">
                    <span class="text-xs font-bold text-sf-muted">فروقات الصرف المستحقة (التسوية)</span>
                    <h4 class="text-xl font-black font-mono"
                        [class]="(data()?.settlementDifference || 0) >= 0 ? 'text-sf-success' : 'text-sf-danger'">
                      {{ ((data()?.settlementDifference || 0) >= 0 ? '+' : '') + formatCurrency(data()?.settlementDifference || 0) }}
                    </h4>
                    <p class="text-[10px] text-sf-muted font-semibold">
                      {{ (data()?.settlementDifference || 0) >= 0 ? 'بونص تسوية ربع سنوية مستحق صرفه.' : 'عجز تسوية (مطالبة مستردة).' }}
                    </p>
                  </div>

                </div>

                <!-- Admin Action and Settlement Status -->
                <div class="pt-6 border-t border-sf-border/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <!-- Settlement status indicator -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                         [class]="data()?.settlement ? 'bg-sf-success/15 text-sf-success' : 'bg-sf-warning/15 text-sf-warning'">
                      <ng-icon [name]="data()?.settlement ? 'heroCheckCircle' : 'heroExclamationTriangle'"></ng-icon>
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-sf-text">حالة تسوية الربع الحالي في النظام</h4>
                      <p class="text-xs text-sf-muted mt-0.5">
                        {{ data()?.settlement ? 'تم اعتماد التسوية وحفظ السجل المالي.' : 'لم يتم تسجيل تسوية رسمية بعد في النظام.' }}
                      </p>
                    </div>
                  </div>

                  <!-- Action button (Admins only!) -->
                  <button *ngIf="isAdminOrManager()" (click)="recordQuarterlySettlement()"
                          [disabled]="settling()"
                          class="px-8 py-3.5 rounded-2xl bg-sf-primary text-white font-bold shadow-glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <ng-icon name="heroCalculator" class="text-lg"></ng-icon>
                    <span>{{ settling() ? 'جاري إجراء التسوية...' : 'اعتماد وتسجيل تسوية الربع' }}</span>
                  </button>
                </div>
              </div>

              <!-- Settlement Details / Audit log -->
              <div class="glass-card p-6 sm:p-8 rounded-3xl border border-sf-border shadow-2xl space-y-4" *ngIf="data()?.settlement">
                <h3 class="text-lg font-display font-bold text-sf-text">تفاصيل سجل التسوية المعتمد</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold text-sf-text">
                  <div class="p-3.5 bg-sf-surface border border-sf-border rounded-xl space-y-1">
                    <span class="text-sf-muted block">رقم مرجع التسوية</span>
                    <span class="font-mono text-xs block font-bold text-sf-text">{{ data()?.settlement?._id }}</span>
                  </div>
                  <div class="p-3.5 bg-sf-surface border border-sf-border rounded-xl space-y-1">
                    <span class="text-sf-muted block">الربع والتاريخ المالي</span>
                    <span class="block font-bold text-sf-text">الربع {{ data()?.settlement?.quarter }} - سنة {{ data()?.settlement?.year }}</span>
                  </div>
                  <div class="p-3.5 bg-sf-surface border border-sf-border rounded-xl space-y-1">
                    <span class="text-sf-muted block">تاريخ الاعتماد</span>
                    <span class="block font-bold text-sf-text">{{ formatDate(data()?.settlement?.createdAt) }}</span>
                  </div>
                  <div class="p-3.5 bg-sf-surface border border-sf-border rounded-xl space-y-1">
                    <span class="text-sf-muted block">حالة التسوية</span>
                    <span class="text-sf-success block font-black">معتمد ومرحل للحسابات</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- TAB 4: COMMISSION SIMULATOR SANDBOX -->
            <div *ngIf="activeTab() === 'simulator'" class="space-y-6 animate-fade-in">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <!-- Inputs Section (Left / 7cols) -->
                <div class="lg:col-span-7 glass-card p-6 sm:p-8 rounded-[2rem] border border-sf-border shadow-2xl space-y-6">
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text flex items-center gap-2">
                      <ng-icon name="heroCalculator" class="text-sf-primary"></ng-icon>
                      المدخلات والمحددات المالية لنسب الصفقات
                    </h3>
                    <p class="text-xs text-sf-muted mt-1">أدخل قيم الصفقة، مستوى الموظف وعمولة المطور لمعرفة آلية التوزيع.</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Seniority Role Selection -->
                    <div class="space-y-2">
                      <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستوى الوظيفي للموظف</label>
                      <select [(ngModel)]="simInputs.role" (change)="runSimulation()"
                              class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary outline-none transition-all font-semibold text-sf-text">
                        <option value="Fresh">Fresh (مبتدئ)</option>
                        <option value="BA">Property Advisor (BA)</option>
                        <option value="BC">Property Consultant (BC)</option>
                        <option value="Senior">Senior Property Consultant</option>
                        <option value="SV">Supervisor (SV)</option>
                        <option value="TeamLeader">Team Leader (قائد فريق)</option>
                      </select>
                    </div>

                    <!-- Developer Commission Rate % -->
                    <div class="space-y-2">
                      <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">نسبة عمولة المطور (%)</label>
                      <input type="number" [(ngModel)]="simInputs.developerRate" (input)="runSimulation()" step="0.1" placeholder="مثال: 3.5"
                             class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary outline-none transition-all font-semibold text-sf-text font-mono">
                    </div>

                    <!-- Sale value -->
                    <div class="space-y-2">
                      <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">قيمة الصفقة الإجمالية (EGP)</label>
                      <input type="number" [(ngModel)]="simInputs.salesAmount" (input)="runSimulation()" step="100000" placeholder="مثال: 10,000,000"
                             class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary outline-none transition-all font-semibold text-sf-text font-mono">
                    </div>

                    <!-- Sale Source Referral -->
                    <div class="space-y-2">
                      <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">مصدر الصفقة / إحالة خارجية</label>
                      <select [(ngModel)]="simInputs.saleSource" (change)="runSimulation()"
                              class="w-full px-4 py-3 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary outline-none transition-all font-semibold text-sf-text">
                        <option value="Company">مبيعات الشركة (عادية)</option>
                        <option value="Referral">إحالة خارجية (Referral)</option>
                      </select>
                    </div>
                  </div>

                  <!-- Dynamic Info Notes -->
                  <div class="p-4 bg-sf-surface border border-sf-border rounded-2xl flex gap-3 text-xs text-sf-muted leading-relaxed align-middle">
                    <ng-icon name="heroInformationCircle" class="text-lg text-sf-primary shrink-0 mt-0.5"></ng-icon>
                    <div>
                      <span class="font-bold text-sf-text block mb-1">الربط مع الترجت الربع سنوي:</span>
                      العمولات الربيعية تعتمد كلياً على فئة الترجت التي يتم تحقيقها بنهاية الربع. المحاكي يعطيك استحقاقات هذه الصفقة كصفقة منفردة بناء على فئات المستويات.
                    </div>
                  </div>
                </div>

                <!-- Simulation Results Section (Right / 5cols) -->
                <div class="lg:col-span-5 glass-card p-6 sm:p-8 rounded-[2rem] border border-sf-border shadow-2xl space-y-6 relative overflow-hidden group">
                  <div class="absolute -right-10 -bottom-10 w-36 h-36 bg-sf-primary/5 rounded-full blur-2xl group-hover:bg-sf-primary/10 transition-all"></div>
                  
                  <div>
                    <h3 class="text-lg font-display font-bold text-sf-text flex items-center gap-2">
                      <ng-icon name="heroSparkles" class="text-sf-primary"></ng-icon>
                      نتائج المحاكاة المالية التقديرية
                    </h3>
                  </div>

                  <!-- Loading Simulator State -->
                  <div *ngIf="simulating()" class="py-12 flex items-center justify-center">
                    <div class="w-8 h-8 border-4 border-sf-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>

                  <div *ngIf="!simulating() && simResult" class="space-y-6 animate-fade-in text-sm font-semibold">
                    
                    <!-- Slabs metrics -->
                    <div class="space-y-3.5 divide-y divide-sf-border/30">
                      
                      <!-- developer commission classification -->
                      <div class="flex items-center justify-between pt-1">
                        <span class="text-sf-muted">تصنيف العقد</span>
                        <span class="text-sf-text font-bold bg-sf-primary/5 border border-sf-primary/20 px-2.5 py-1 rounded-xl text-xs">
                          {{ simResult.isCompanySale ? 'مبيعات شركة (&le; 2.9%)' : 'مبيعات شخصية (&ge; 3.0%)' }}
                        </span>
                      </div>

                      <!-- 1/3 rule check -->
                      <div class="flex items-center justify-between pt-3.5">
                        <span class="text-sf-muted">قانون الثلث (1/3)</span>
                        <span class="text-xs font-bold px-2 py-0.5 rounded-md"
                              [class]="simResult.isOneThirdApplied ? 'bg-sf-danger/10 text-sf-danger' : 'bg-sf-success/10 text-sf-success'">
                          {{ simResult.isOneThirdApplied ? 'مطبق (تخفيض 1/3)' : 'غير مطبق (مبيعات كاملة)' }}
                        </span>
                      </div>

                      <!-- Monthly payout -->
                      <div class="flex items-center justify-between pt-3.5">
                        <span class="text-sf-muted">الحد الأدنى الفوري (علاوة شهرية)</span>
                        <span class="font-mono text-sf-primary text-base font-black">
                          {{ formatCurrency(simResult.monthlyPayoutMin) }}
                        </span>
                      </div>

                      <!-- Target Impact contribution value -->
                      <div class="flex items-center justify-between pt-3.5">
                        <span class="text-sf-muted">القيمة المضافة للمستهدف</span>
                        <span class="font-mono text-sf-text text-base font-bold">
                          {{ formatCurrency(simResult.targetContribution) }}
                        </span>
                      </div>

                      <!-- Final quarterly payout estimate -->
                      <div class="flex items-center justify-between pt-3.5">
                        <span class="text-sf-muted">إجمالي العلاوة الربيعية المقدرة (بفئة 100%)</span>
                        <span class="font-mono text-sf-success text-lg font-black">
                          {{ formatCurrency(simResult.estimatedFinalQuarterlyPayout) }}
                        </span>
                      </div>

                    </div>

                    <!-- Split breakdown: salesperson portion vs manager portion -->
                    <div class="p-4 bg-sf-bg rounded-2xl border border-sf-border space-y-3.5">
                      <span class="text-xs font-bold text-sf-muted block">توزيع عمولة المطور والمبيعات:</span>
                      
                      <!-- salesperson share -->
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-sf-muted">حصة موظف المبيعات</span>
                          <span class="text-sf-text font-bold font-mono">{{ formatCurrency(simResult.split?.salespersonAmount || 0) }}</span>
                        </div>
                        <div class="w-full h-2 bg-sf-border rounded-full overflow-hidden">
                          <div class="h-full bg-sf-success rounded-full" 
                               [style.width.%]="(simResult.split?.salespersonAmount / (simResult.split?.salespersonAmount + simResult.split?.managerAmount || 1)) * 100"></div>
                        </div>
                      </div>

                      <!-- manager share -->
                      <div class="space-y-1.5" *ngIf="simResult.split?.managerAmount > 0">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-sf-muted">حصة المدير (Supervisor / TL)</span>
                          <span class="text-sf-text font-bold font-mono">{{ formatCurrency(simResult.split?.managerAmount || 0) }}</span>
                        </div>
                        <div class="w-full h-2 bg-sf-border rounded-full overflow-hidden">
                          <div class="h-full bg-sf-warning rounded-full" 
                               [style.width.%]="(simResult.split?.managerAmount / (simResult.split?.salespersonAmount + simResult.split?.managerAmount || 1)) * 100"></div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class CommissionsComponent implements OnInit {
  private commissionService = inject(CommissionService);
  private confirmDialog     = inject(ConfirmDialogService);
  private destroyRef = inject(DestroyRef);
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  public themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  private langService = inject(LanguageService);

  loading = signal(false);
  settling = signal(false);
  simulating = signal(false);
  salesEmployees = signal<any[]>([]);
  selectedEmployeeId = signal<string>('');
  selectedQuarterId = signal<string>('');

  data = signal<CommissionProgress | null>(null);

  activeTab = signal<'board' | 'payouts' | 'settlement' | 'simulator'>('board');

  // Simulator binding variables
  simInputs = {
    role: 'BA',
    salesAmount: 10000000,
    developerRate: 3.5,
    saleSource: 'Company'
  };
  simResult: any = null;

  constructor() {
    // Sync local quarter selector whenever the global quarter changes (e.g. from navbar)
    effect(() => {
      const q = this.themeService.currentQuarter();
      this.selectedQuarterId.set(q);
      if (this.selectedEmployeeId()) {
        this.loadCommissionData();
      }
    });
  }

  ngOnInit() {
    // Determine active quarter (effect above keeps it in sync after init)
    this.selectedQuarterId.set(this.themeService.currentQuarter());
    
    // Load sales employees list
    this.employeeService.getSalesEmployees().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.success && res.data) {
        this.salesEmployees.set(res.data);
        
        // Match user's employeeId
        const currentUserEmployeeId = this.authService.currentUser()?.employeeId;
        const employeeIdStr = (currentUserEmployeeId && typeof currentUserEmployeeId === 'object') 
          ? (currentUserEmployeeId as any)._id 
          : currentUserEmployeeId;

        // If current employee is in the sales employees list, select it
        const match = res.data.find(emp => emp._id === employeeIdStr);
        if (match) {
          this.selectedEmployeeId.set(match._id);
        } else if (res.data.length > 0) {
          this.selectedEmployeeId.set(res.data[0]._id);
        }

        this.loadCommissionData();
      }
    });

    this.runSimulation();
  }

  isSalesRole(): boolean {
    return this.authService.currentUser()?.role === 'employee';
  }

  isAdminOrManager(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'manager';
  }

  onEmployeeChange(event: any) {
    this.selectedEmployeeId.set(event.target.value);
    this.loadCommissionData();
  }

  onQuarterChange(event: any) {
    // Updating the global quarter triggers the effect, which syncs selectedQuarterId and reloads
    this.themeService.setQuarter(event.target.value);
  }

  loadCommissionData() {
    const empId = this.selectedEmployeeId();
    const qId = this.selectedQuarterId();
    if (!empId || !qId) return;

    this.loading.set(true);
    this.commissionService.getSalespersonCommission(empId, qId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.success) {
          this.data.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.showError(this.translate.instant('commission.load_error'));
      }
    });
  }

  togglePayoutStatus(payout: any) {
    const nextStatus = payout.status === 'paid' ? 'pending' : 'paid';
    this.commissionService.updatePayoutStatus(payout.id || payout._id, nextStatus).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translate.instant('commission.payout_updated'));
          this.loadCommissionData();
        }
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || this.translate.instant('commission.payout_update_error'));
      }
    });
  }

  async bulkUpdatePayoutStatus(status: 'paid') {
    const payouts = this.data()?.payouts || [];
    const pendingPayouts = payouts.filter(p => p.status !== status);
    if (pendingPayouts.length === 0) {
      this.toastService.showInfo(this.translate.instant('commission.all_paid'));
      return;
    }

    const ok1 = await this.confirmDialog.confirm({
      title: 'صرف الدفعات',
      message: `هل أنت متأكد من صرف ${pendingPayouts.length} دفعة بالكامل؟`,
      confirmLabel: 'صرف',
      type: 'warning',
    });
    if (!ok1) return;

    let completed = 0;
    pendingPayouts.forEach(p => {
      this.commissionService.updatePayoutStatus(p.id || p._id, status).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          completed++;
          if (completed === pendingPayouts.length) {
            this.toastService.showSuccess(this.translate.instant('commission.bulk_paid_success'));
            this.loadCommissionData();
          }
        }
      });
    });
  }

  async recordQuarterlySettlement() {
    const empId = this.selectedEmployeeId();
    const qId = this.selectedQuarterId();
    if (!empId || !qId) return;

    // quarterId: "Q1-2026"
    const parts = qId.split('-');
    if (parts.length !== 2) return;
    const quarterNum = parseInt(parts[0].replace('Q', ''));
    const yearNum = parseInt(parts[1]);

    const ok2 = await this.confirmDialog.confirm({
      title: 'اعتماد التسوية الربعية',
      message: `سيتم حفظ تسوية ${this.formatQ(qId)} نهائياً. هذا الإجراء لا يمكن التراجع عنه.`,
      confirmLabel: 'اعتماد',
      type: 'warning',
    });
    if (!ok2) return;

    this.settling.set(true);
    this.commissionService.triggerQuarterlySettlement(quarterNum, yearNum, empId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.settling.set(false);
        if (res.success) {
          this.toastService.showSuccess(this.translate.instant('commission.settle_success'));
          this.loadCommissionData();
        }
      },
      error: (err) => {
        this.settling.set(false);
        this.toastService.showError(err.error?.message || this.translate.instant('commission.settle_error'));
      }
    });
  }

  runSimulation() {
    this.simulating.set(true);
    this.commissionService.simulateCommission(this.simInputs).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.simulating.set(false);
        if (res.success) {
          this.simResult = res.data;
        }
      },
      error: () => {
        this.simulating.set(false);
      }
    });
  }

  // Formatting helpers
  formatCurrency(value: number): string {
    return new Intl.NumberFormat(this.langService.currentLocale(), {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.langService.currentLocale(), {
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(this.langService.currentLocale(), {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  }

  formatQ(q: string): string {
    return formatQuarter(q);
  }

  formatRole(roleKey: string): string {
    switch (roleKey) {
      case 'Fresh': return 'Fresh (مبتدئ)';
      case 'BA': return 'Advisor (BA)';
      case 'BC': return 'Consultant (BC)';
      case 'Senior': return 'Senior Property Consultant';
      case 'SV': return 'Supervisor (SV)';
      case 'TeamLeader': return 'Team Leader';
      default: return roleKey || 'موظف مبيعات';
    }
  }

  formatSlabTier(achievementPercentage: number, seniorityLevel: string): string {
    if (seniorityLevel === 'Fresh') return 'Fresh (فئة مسطحة)';
    if (seniorityLevel === 'TeamLeader') {
      if (achievementPercentage <= 50) return 'فئة 1 (1,800 EGP/M)';
      if (achievementPercentage <= 75) return 'فئة 2 (2,000 EGP/M)';
      if (achievementPercentage <= 120) return 'فئة 3 (2,200 EGP/M)';
      if (achievementPercentage <= 150) return 'فئة 4 (2,400 EGP/M)';
      return 'فئة 5 (2,600 EGP/M)';
    }

    // Individual standard levels
    if (achievementPercentage <= 50) return 'فئة 1 (4,500 EGP/M)';
    if (achievementPercentage <= 75) return 'فئة 2 (5,000 EGP/M)';
    
    // BA / BC / Senior slabs differ at 76-100% and above
    if (achievementPercentage <= 100) {
      if (seniorityLevel === 'BA') return 'فئة 3 (5,500 EGP/M)';
      if (seniorityLevel === 'BC') return 'فئة 3 (6,000 EGP/M)';
      return 'فئة 3 (6,500 EGP/M)'; // Senior / SV
    }
    if (achievementPercentage <= 150) {
      if (seniorityLevel === 'BA') return 'فئة 4 (6,000 EGP/M)';
      if (seniorityLevel === 'BC') return 'فئة 4 (6,500 EGP/M)';
      if (seniorityLevel === 'Senior') return 'فئة 4 (7,000 EGP/M)';
      return 'فئة 4 (7,500 EGP/M)'; // SV
    }
    // > 150%
    if (seniorityLevel === 'BA') return 'فئة 5 (6,500 EGP/M)';
    if (seniorityLevel === 'BC') return 'فئة 5 (7,000 EGP/M)';
    if (seniorityLevel === 'Senior') return 'فئة 5 (7,500 EGP/M)';
    return 'فئة 5 (8,000 EGP/M)'; // SV
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}
