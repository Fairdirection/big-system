import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ThemeService } from '@core/services/theme.service';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ApiResponse } from '@core/models/api-response.model';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChartBar, heroArrowTrendingUp, heroUsers, heroFire, heroInformationCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-target-list',
  standalone: true,
  imports: [CommonModule, CurrencyEgpPipe, NgIconComponent],
  providers: [
    provideIcons({ heroChartBar, heroArrowTrendingUp, heroUsers, heroFire, heroInformationCircle })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in" *ngIf="summary() as data; else loading">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">مستهدفات الأداء</h1>
          <p class="text-sf-muted font-medium mt-1">متابعة تقدم الأفراد والفرق مقابل الأهداف الربعية.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <select [value]="currentQuarter()" (change)="onQuarterChange($event)" 
                  class="px-4 py-2.5 bg-sf-surface border border-sf-border rounded-xl text-sm font-bold text-sf-text outline-none focus:ring-2 focus:ring-sf-primary/50 cursor-pointer">
            @for (q of availableQuarters(); track q) {
              <option [value]="q">{{ formatQ(q) }}</option>
            }
          </select>
        </div>
      </header>

      <!-- Targets Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-xl flex items-center gap-5">
          <div class="w-12 h-12 rounded-xl bg-sf-primary/20 flex items-center justify-center text-sf-primary border border-sf-primary/30">
            <ng-icon name="heroChartBar" class="text-2xl"></ng-icon>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-sf-muted uppercase tracking-widest">إجمالي مستهدف القسم</span>
            <span class="text-xl font-black text-sf-text">{{ data.totals.totalAdjustedTarget | currencyEgp }}</span>
          </div>
        </div>
        
        <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-xl flex items-center gap-5">
          <div class="w-12 h-12 rounded-xl bg-sf-info/20 flex items-center justify-center text-sf-info border border-sf-info/30">
            <ng-icon name="heroArrowTrendingUp" class="text-2xl"></ng-icon>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-sf-muted uppercase tracking-widest">التقدم الإجمالي</span>
            <span class="text-xl font-black text-sf-info">{{ data.totals.overallAchievementPercentage }}%</span>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-xl flex items-center gap-5">
          <div class="w-12 h-12 rounded-xl bg-sf-warning/20 flex items-center justify-center text-sf-warning border border-sf-warning/30">
            <ng-icon name="heroUsers" class="text-2xl"></ng-icon>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-sf-muted uppercase tracking-widest">موظفي المبيعات</span>
            <span class="text-xl font-black text-sf-text">{{ data.employees.length }}</span>
          </div>
        </div>
      </div>

      <!-- Individual Targets List -->
      <div class="glass-card rounded-3xl border border-sf-border shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-sf-border/30 bg-sf-surface/50 flex items-center justify-between">
          <h3 class="text-lg font-display font-bold text-sf-text flex items-center gap-3">
            <ng-icon name="heroUsers" class="text-sf-primary"></ng-icon>
            تقدم موظفي المبيعات
          </h3>
          <span class="text-xs font-bold text-sf-muted uppercase tracking-widest">{{ formatQ(currentQuarter()) }}</span>
        </div>

        <div class="divide-y divide-sf-border/50">
          @for (emp of data.employees; track emp.employeeId) {
            <div class="p-6 hover:bg-sf-surface/30 transition-colors group">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <!-- Seller Info -->
                <div class="flex items-center gap-4 w-full md:w-64">
                  <div class="w-10 h-10 rounded-xl bg-sf-bg border border-sf-border flex items-center justify-center text-sf-text font-black text-sm shadow-inner group-hover:text-sf-primary transition-colors">
                    {{ emp.employeeName.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-sf-text">{{ emp.employeeName }}</h4>
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ emp.teamName || 'بدون فريق' }}</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="flex-1 w-full">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">نسبة الإنجاز</span>
                    <span class="text-xs font-black text-sf-primary">{{ emp.achievementPercentage }}%</span>
                  </div>
                  <div class="h-2 w-full bg-sf-bg rounded-full overflow-hidden border border-sf-border/50 shadow-inner">
                    <div class="h-full bg-gradient-purple shadow-glow-sm transition-all duration-1000 ease-out"
                         [style.width.%]="emp.achievementPercentage"></div>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-8 w-full md:w-auto md:min-w-[240px] justify-between">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">المحقق</span>
                    <span class="text-sm font-black text-sf-text">{{ emp.achievedSales | currencyEgp }}</span>
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">المستهدف</span>
                    <span class="text-sm font-black text-sf-subtle">{{ emp.adjustedTarget | currencyEgp }}</span>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="py-24 text-center opacity-30">
              <ng-icon name="heroChartBar" class="text-5xl mb-3"></ng-icon>
              <p class="font-bold uppercase tracking-widest text-sm">لا توجد مستهدفات محددة لهذه الفترة</p>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <ng-template #loading>
      <div class="space-y-8 animate-pulse">
        <header class="flex justify-between items-center">
          <div class="h-8 w-48 bg-sf-surface rounded-lg skeleton"></div>
          <div class="h-10 w-32 bg-sf-surface rounded-xl skeleton"></div>
        </header>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="h-24 bg-sf-surface rounded-2xl skeleton" *ngFor="let i of [1,2,3]"></div>
        </div>
        <div class="h-80 bg-sf-surface rounded-3xl skeleton"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .shadow-glow-sm { box-shadow: 0 0 10px rgba(147, 51, 234, 0.3); }
  `]
})
export class TargetListComponent {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);

  summary = signal<any>(null);
  currentQuarter = this.themeService.currentQuarter;
  availableQuarters = this.themeService.availableQuarters;

  constructor() {
    effect(() => {
      this.loadSummary(this.currentQuarter());
    });
  }

  onQuarterChange(event: any) {
    this.themeService.setQuarter(event.target.value);
  }

  loadSummary(quarterId: string) {
    this.themeService.loading.set(true);
    this.summary.set(null); // Force skeleton
    this.http.get<ApiResponse<any>>(`${environment.apiUrl}/targets/summary`, {
      params: { quarterId }
    }).subscribe({
      next: res => {
        this.themeService.loading.set(false);
        if (res.success) {
          this.summary.set(res.data);
        }
      },
      error: () => this.themeService.loading.set(false)
    });
  }

  formatQ(q: string) {
    return formatQuarter(q);
  }
}
