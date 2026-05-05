import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '@core/services/dashboard.service';
import { ThemeService } from '@core/services/theme.service';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ApiResponse } from '@core/models/api-response.model';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroBanknotes, 
  heroChartBar, 
  heroShoppingBag, 
  heroClock,
  heroCheckCircle,
  heroArrowTrendingUp,
  heroInformationCircle,
  heroUsers,
  heroBriefcase
} from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ 
      heroBanknotes, 
      heroChartBar, 
      heroShoppingBag, 
      heroClock,
      heroCheckCircle,
      heroArrowTrendingUp,
      heroInformationCircle,
      heroUsers,
      heroBriefcase
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in" *ngIf="stats() as data; else loading">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">لوحة التحكم</h1>
            <div class="group relative">
              <ng-icon name="heroInformationCircle" class="text-sf-muted cursor-help"></ng-icon>
              <div class="absolute bottom-full right-0 mb-2 w-64 p-2 bg-sf-surface border border-sf-border rounded-lg shadow-xl text-[10px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                تعرض هذه اللوحة ملخصاً لأداء الشركة والموظفين والتحصيلات المالية للربع الحالي.
              </div>
            </div>
          </div>
          <p class="text-sf-muted mt-1 font-medium">مقاييس الأداء في الوقت الفعلي للربع الحالي.</p>
        </div>
        
        <div class="flex items-center gap-2 px-4 py-2 bg-sf-surface border border-sf-border rounded-xl shadow-sm">
          <ng-icon name="heroClock" class="text-sf-primary"></ng-icon>
          <span class="text-sm font-bold text-sf-text">{{ formatQ(currentQuarter()) }}</span>
        </div>
      </header>
      
      <!-- ... rest of template ... -->
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div class="relative group">
          <app-stat-card
            title="إجمالي الإيرادات"
            [value]="data.totalRevenue"
            [isCurrency]="true"
            icon="heroBanknotes"
            trend="+12.5%"
            color="purple"
          ></app-stat-card>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">إجمالي العمولات المستحقة</p>
        </div>

        <div class="relative group">
          <app-stat-card
            title="إجمالي المبيعات"
            [value]="data.totalSales"
            icon="heroShoppingBag"
            trend="+4.2%"
            color="blue"
          ></app-stat-card>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">عدد الوحدات المباعة</p>
        </div>

        <div class="relative group">
          <app-stat-card
            title="تحقيق المستهدف"
            [value]="(data.targetCompletion || 0) + '%'"
            icon="heroArrowTrendingUp"
            color="pink"
          ></app-stat-card>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">النسبة مقارنة بالمستهدف</p>
        </div>

        <div class="relative group">
          <app-stat-card
            title="حجم المبيعات"
            [value]="data.totalVolume"
            [isCurrency]="true"
            icon="heroBriefcase"
            color="blue"
          ></app-stat-card>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">إجمالي قيمة العقود (Unit Value)</p>
        </div>

        <div class="relative group">
          <app-stat-card
            title="العملاء النشطون"
            [value]="data.totalClients"
            icon="heroUsers"
            color="cyan"
          ></app-stat-card>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">عدد العملاء الذين تمت خدمتهم</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <!-- Team Performance -->
        <div class="lg:col-span-2 glass-card p-6 rounded-2xl border border-sf-border shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-display font-bold text-sf-text">أداء الفرق</h3>
              <span class="text-[10px] bg-sf-primary/10 text-sf-primary px-2 py-0.5 rounded-full font-bold">موزع حسب الإيراد</span>
            </div>
            <button class="text-xs font-bold text-sf-primary hover:underline uppercase tracking-wider">عرض التفاصيل</button>
          </div>

          <div class="space-y-6">
            @for (team of data.teamPerformance; track team.teamName) {
              <div class="group">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-sf-primary shadow-glow-sm"></div>
                    <span class="text-sm font-semibold text-sf-text">{{ team.teamName }}</span>
                  </div>
                  <span class="text-xs font-bold text-sf-muted">{{ team.revenue | currencyEgp }}</span>
                </div>
                <div class="h-2 w-full bg-sf-bg/50 rounded-full overflow-hidden border border-sf-border/30">
                  <div class="h-full bg-gradient-to-r from-sf-primary to-sf-secondary shadow-premium transition-all duration-1000 ease-out"
                       [style.width.%]="(team.revenue / (data.totalRevenue || 1)) * 100"></div>
                </div>
                <div class="flex justify-between mt-1 px-1">
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ team.salesCount }} مبيعة</span>
                  <span class="text-[10px] font-bold text-sf-primary uppercase tracking-tighter">
                    {{ ((team.revenue / (data.totalRevenue || 1)) * 100) | number:'1.0-1' }}%
                  </span>
                </div>

                <!-- NEW: Individual Members Progress (Quick View) -->
                <div class="mt-4 pt-4 border-t border-sf-border/20 space-y-3">
                   @for (member of team.membersPerformance; track member.employeeId) {
                     <div class="flex flex-col gap-1.5">
                       <div class="flex justify-between items-center">
                         <a [routerLink]="['/employees', member.employeeId]" 
                            class="text-[10px] font-bold text-sf-text hover:text-sf-primary transition-colors cursor-pointer">
                            {{ member.name }}
                         </a>
                         <span class="text-[9px] font-black text-sf-muted">{{ member.achievementPercentage }}%</span>
                       </div>
                       <div class="h-1 w-full bg-sf-bg/30 rounded-full overflow-hidden">
                          <div class="h-full bg-sf-primary/60 transition-all duration-1000"
                               [style.width.%]="member.achievementPercentage"></div>
                       </div>
                     </div>
                   }
                </div>
              </div>
            } @empty {
              <div class="py-12 flex flex-col items-center justify-center text-sf-muted text-center">
                <ng-icon name="heroChartBar" class="text-4xl mb-3 opacity-20"></ng-icon>
                <p class="font-medium">لا توجد بيانات أداء متاحة حالياً.</p>
                <p class="text-xs opacity-60">تأكد من إدخال مبيعات جديدة لظهور الإحصائيات.</p>
              </div>
            }
          </div>
        </div>

        <!-- Claim Status -->
        <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-sm">
          <div class="flex items-center gap-2 mb-8">
            <h3 class="text-lg font-display font-bold text-sf-text">حالة التحصيل</h3>
            <div class="group relative">
              <ng-icon name="heroInformationCircle" class="text-sf-muted cursor-help size-4"></ng-icon>
              <div class="absolute bottom-full left-0 mb-2 w-48 p-2 bg-sf-surface border border-sf-border rounded-lg shadow-xl text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                توضح هذه النسبة مقدار ما تم تحصيله فعلياً من العمولات المطالب بها.
              </div>
            </div>
          </div>
          
          <div class="flex flex-col items-center justify-center py-4">
            <div class="relative w-40 h-40 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" stroke-width="12" class="text-sf-bg"></circle>
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" stroke-width="12" class="text-sf-primary"
                        [attr.stroke-dasharray]="440"
                        [attr.stroke-dashoffset]="440 - (440 * (data.collectedClaims || 0) / ((data.pendingClaims || 0) + (data.collectedClaims || 0) || 1))"
                        stroke-linecap="round"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-display font-black text-sf-text">
                  {{ (data.collectedClaims || 0) / ((data.pendingClaims || 0) + (data.collectedClaims || 0) || 1) | percent }}
                </span>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-wider">تم التحصيل</span>
              </div>
            </div>

            <div class="grid grid-cols-2 w-full gap-4 mt-10">
              <div class="p-3 bg-sf-bg rounded-xl border border-sf-border flex flex-col items-center">
                <span class="text-lg font-bold text-sf-text">{{ data.collectedClaims }}</span>
                <span class="text-[10px] font-bold text-sf-success uppercase tracking-tighter">محصلة</span>
              </div>
              <div class="p-3 bg-sf-bg rounded-xl border border-sf-border flex flex-col items-center">
                <span class="text-lg font-bold text-sf-text">{{ data.pendingClaims }}</span>
                <span class="text-[10px] font-bold text-sf-warning uppercase tracking-tighter">قيد الانتظار</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton Template -->
    <ng-template #loading>
      <div class="space-y-8 animate-pulse">
        <header class="flex justify-between items-center">
          <div class="space-y-2">
            <div class="h-8 w-48 bg-sf-surface rounded-lg skeleton"></div>
            <div class="h-4 w-64 bg-sf-surface rounded-lg skeleton"></div>
          </div>
          <div class="h-10 w-32 bg-sf-surface rounded-xl skeleton"></div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="h-32 bg-sf-surface rounded-2xl border border-sf-border skeleton" *ngFor="let i of [1,2,3,4]"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 h-80 bg-sf-surface rounded-2xl border border-sf-border skeleton"></div>
          <div class="h-80 bg-sf-surface rounded-2xl border border-sf-border skeleton"></div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [``]
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private themeService = inject(ThemeService);
  
  stats = signal<DashboardStats | null>(null);
  currentQuarter = this.themeService.currentQuarter;

  constructor() {
    // Reload stats whenever currentQuarter changes globally
    effect(() => {
      this.loadStats(this.currentQuarter());
    });
  }

  loadStats(quarterId: string) {
    this.themeService.loading.set(true);
    this.stats.set(null); // Force skeleton
    this.dashboardService.getStats(quarterId).subscribe({
      next: (res: ApiResponse<DashboardStats>) => {
        this.themeService.loading.set(false);
        if (res.success) {
          this.stats.set(res.data);
        }
      },
      error: (err) => {
        this.themeService.loading.set(false);
        console.error('Error fetching dashboard stats:', err);
      }
    });
  }

  formatQ(q: string) {
    return formatQuarter(q);
  }
}
