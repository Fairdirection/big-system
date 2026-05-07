import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService } from '@core/services/team.service';
import { ThemeService } from '@core/services/theme.service';
import { ApiResponse } from '@core/models/api-response.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { 
  heroArrowRight, heroUserGroup, heroTrophy, heroChartBar, 
  heroUsers, heroBuildingOffice, heroCalendar, heroChevronDown, 
  heroChevronUp, heroPencilSquare, heroIdentification
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, NgIconComponent, RouterLink, CurrencyEgpPipe],
  providers: [
    provideIcons({ 
      heroArrowRight, heroUserGroup, heroTrophy, heroChartBar, 
      heroUsers, heroBuildingOffice, heroCalendar, heroChevronDown, 
      heroChevronUp, heroPencilSquare, heroIdentification
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in pb-20" *ngIf="performance() as perf">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <button routerLink="/teams" class="p-3 rounded-2xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-primary transition-all">
            <ng-icon name="heroArrowRight"></ng-icon>
          </button>
          
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-3xl bg-sf-primary/10 flex items-center justify-center text-sf-primary text-3xl shadow-premium">
              <ng-icon name="heroUserGroup"></ng-icon>
            </div>
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">{{ perf.teamName }}</h1>
                <span class="badge badge-success">فريق نشط</span>
              </div>
              <p class="text-sf-muted font-bold flex items-center gap-2">
                <ng-icon name="heroIdentification" class="text-sf-primary"></ng-icon>
                <span>تحليل أداء الربع الحالي: {{ perf.quarterId }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button [routerLink]="['edit']" class="btn btn-secondary h-12 px-6">
            <ng-icon name="heroPencilSquare"></ng-icon>
            <span>تعديل الفريق</span>
          </button>
        </div>
      </header>

      <!-- Target Calculation Note Banner -->
      <div class="glass-card p-4 rounded-2xl border border-sf-border bg-sf-primary/5 flex items-start gap-3 text-xs leading-relaxed text-sf-text max-w-5xl relative overflow-hidden group">
        <div class="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sf-primary to-sf-secondary"></div>
        <div class="w-8 h-8 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary shrink-0">
          <ng-icon name="heroChartBar" class="text-lg"></ng-icon>
        </div>
        <div class="space-y-1">
          <p class="font-bold text-sf-text text-sm">💡 كيف يتم حساب مستهدف الفريق للربع الحالي؟</p>
          <p class="text-sf-muted font-medium">
            يتم احتساب مستهدف الفريق ديناميكياً كمجموع <strong>المستهدفات المعدلة</strong> لجميع أعضاء الفريق النشطين في هذا الربع. 
            المستهدف الفردي لكل عضو يُحسب تناسبياً بناءً على عدد أيام انضمامه الفعلي للفرق في الربع الحالي (قاعدة الـ 30 يوماً للشهر)، مما يضمن عدالة التقييم في حال الانضمام المتأخر أو الانتقال.
          </p>
        </div>
      </div>

      <!-- Team Overview Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-sf-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
          <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">إجمالي مبيعات الفريق</p>
          <div class="flex items-end justify-between relative z-10">
            <h4 class="text-3xl font-display font-black text-sf-text">{{ perf.totalAchieved | currencyEgp }}</h4>
            <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
              <ng-icon name="heroTrophy"></ng-icon>
            </div>
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-sf-accent/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
          <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">المستهدف المعدل</p>
          <div class="flex items-end justify-between relative z-10">
            <h4 class="text-3xl font-display font-black text-sf-text">{{ perf.totalAdjustedTarget | currencyEgp }}</h4>
            <div class="w-10 h-10 rounded-xl bg-sf-accent/10 flex items-center justify-center text-sf-accent">
              <ng-icon name="heroChartBar"></ng-icon>
            </div>
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-sf-success/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
          <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">نسبة إنجاز الفريق</p>
          <div class="flex items-end justify-between relative z-10">
            <h4 class="text-3xl font-display font-black text-sf-text">{{ perf.overallAchievementPercentage | number:'1.0-1' }}%</h4>
            <div class="w-10 h-10 rounded-xl bg-sf-success/10 flex items-center justify-center text-sf-success">
              <ng-icon name="heroUserGroup"></ng-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Members Detailed Performance -->
      <div class="space-y-6">
        <h3 class="text-xl font-display font-black text-sf-text px-2">تفاصيل أداء أعضاء الفريق</h3>
        
        <div class="grid grid-cols-1 gap-6">
          <div *ngFor="let member of perf.membersProgress" 
               class="glass-card rounded-3xl border border-sf-border shadow-xl overflow-hidden transition-all duration-500"
               [class.ring-2]="expandedMember() === member.employeeId"
               [class.ring-sf-primary/20]="expandedMember() === member.employeeId">
            
            <!-- Member Header (Summary) -->
            <div (click)="toggleExpand(member.employeeId)" 
                 class="p-6 cursor-pointer hover:bg-sf-surface/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="flex items-center gap-5">
                <div class="w-14 h-14 rounded-2xl bg-sf-bg border border-sf-border flex items-center justify-center text-sf-primary text-xl font-black shadow-inner">
                  {{ member.name.charAt(0) }}
                </div>
                <div>
                  <h4 class="text-lg font-bold text-sf-text tracking-tight">{{ member.name }}</h4>
                  <div class="flex items-center gap-3 mt-1 text-[10px] font-black text-sf-muted uppercase">
                    <span>كود: {{ member.code }}</span>
                    <span class="opacity-30">•</span>
                    <span class="text-sf-primary">المستهدف: {{ member.adjustedTarget | currencyEgp }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-8">
                <div class="text-right">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-1">المحقق</p>
                  <p class="text-lg font-black text-sf-success">{{ member.achieved | currencyEgp }}</p>
                </div>
                
                <div class="w-32">
                   <div class="flex justify-between items-center mb-1.5">
                     <span class="text-[10px] font-black text-sf-muted uppercase">الإنجاز</span>
                     <span class="text-[10px] font-black text-sf-primary">{{ member.achievementPercentage | number:'1.0-1' }}%</span>
                   </div>
                   <div class="h-2 w-full bg-sf-bg border border-sf-border rounded-full overflow-hidden">
                     <div class="h-full bg-sf-primary transition-all duration-1000" [style.width.%]="member.achievementPercentage"></div>
                   </div>
                </div>

                <div class="w-10 h-10 rounded-xl bg-sf-surface border border-sf-border flex items-center justify-center text-sf-muted transition-transform"
                     [class.rotate-180]="expandedMember() === member.employeeId">
                  <ng-icon name="heroChevronDown"></ng-icon>
                </div>
              </div>
            </div>

            <!-- Member Details (Sales List) -->
            <div *ngIf="expandedMember() === member.employeeId" 
                 class="border-t border-sf-border bg-sf-surface/30 p-8 animate-fade-in">
              
              <!-- Calculation Breakdown -->
              <div *ngIf="member.fullTarget > 0" class="p-5 rounded-2xl bg-sf-bg border border-sf-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative overflow-hidden group">
                <div class="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-sf-primary to-sf-secondary"></div>
                <div class="space-y-1">
                  <h6 class="text-xs font-black text-sf-muted uppercase tracking-wider flex items-center gap-1.5">
                    🔬 تفاصيل الحسبة الرياضية للمستهدف المعدل
                  </h6>
                  <p class="text-xs text-sf-text font-bold leading-relaxed">
                    (المستهدف الفردي للربع: <span class="text-sf-primary">{{ member.fullTarget | currencyEgp }}</span> ÷ 90 يوماً) × {{ member.actualWorkingDays }} يوم عمل في الفريق = <span class="text-sf-success">{{ member.adjustedTarget | currencyEgp }}</span>
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-3 shrink-0 text-[10px]">
                  <div class="px-3 py-1.5 rounded-xl bg-sf-primary/10 border border-sf-primary/20 font-black text-sf-primary">
                     أيام العمل: {{ member.actualWorkingDays }} يوم
                  </div>
                  <div class="px-3 py-1.5 rounded-xl bg-sf-success/10 border border-sf-success/20 font-black text-sf-success">
                     المستهدف المعدل: {{ member.adjustedTarget | currencyEgp }}
                  </div>
                </div>
              </div>

              <div *ngIf="member.fullTarget === 0" class="p-5 rounded-2xl bg-sf-bg border border-sf-border flex items-center gap-3 mb-6 relative overflow-hidden">
                <div class="absolute inset-y-0 right-0 w-1 bg-sf-accent"></div>
                <p class="text-xs text-sf-muted font-bold">
                  💡 بصفتك قائد الفريق، فإن مستهدفك الفردي هو <span class="text-sf-accent">{{ 0 | currencyEgp }}</span> (يتم احتساب إنجازك من مبيعاتك الشخصية فقط، بينما يُحسب مستهدف الفريق الإجمالي ديناميكياً من مستهدفات الأعضاء).
                </p>
              </div>

              <div class="flex items-center justify-between mb-6">
                <h5 class="text-sm font-black text-sf-text uppercase tracking-widest flex items-center gap-2">
                  <ng-icon name="heroTrophy" class="text-sf-primary"></ng-icon>
                  قائمة المبيعات المحققة ({{ member.sales?.length || 0 }})
                </h5>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (sale of member.sales; track sale._id) {
                  <div class="p-5 rounded-2xl bg-sf-bg border border-sf-border hover:border-sf-primary/40 transition-all group">
                    <div class="flex items-start justify-between mb-4">
                      <div class="w-10 h-10 rounded-xl bg-white border border-sf-border flex items-center justify-center text-sf-primary text-lg">
                        <ng-icon name="heroBuildingOffice"></ng-icon>
                      </div>
                      <span class="badge" 
                            [class.badge-success]="sale.status === 'collected' || sale.status === 'confirmed'"
                            [class.badge-warning]="sale.status === 'claimed'">
                        {{ sale.status === 'confirmed' ? 'مؤكد' : 
                           sale.status === 'collected' ? 'مُحصل' : 'قيد المطالبة' }}
                      </span>
                    </div>
                    <h6 class="font-bold text-sf-text mb-1">{{ sale.projectName }}</h6>
                    <p class="text-[10px] font-bold text-sf-muted mb-4 flex items-center gap-1">
                      <ng-icon name="heroUsers"></ng-icon>
                      العميل: {{ sale.clientName }}
                    </p>
                    <div class="flex items-center justify-between pt-4 border-t border-sf-border/50">
                      <div>
                        <p class="text-[9px] font-black text-sf-muted uppercase mb-0.5">تاريخ التعاقد</p>
                        <p class="text-xs font-bold text-sf-text">{{ sale.contractDate | date:'shortDate' }}</p>
                      </div>
                      <div class="text-left">
                        <p class="text-[9px] font-black text-sf-muted uppercase mb-0.5">القيمة</p>
                        <p class="text-sm font-black text-sf-primary">{{ sale.unitValue | currencyEgp }}</p>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="col-span-full py-12 text-center bg-sf-bg/50 rounded-2xl border border-dashed border-sf-border">
                    <p class="text-sm font-bold text-sf-muted">لا توجد مبيعات مسجلة لهذا العضو في الربع الحالي</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .badge { 
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-success { 
      background-color: rgba(var(--sf-success-rgb), 0.1); 
      color: var(--sf-success); 
    }
    .badge-warning { 
      background-color: rgba(var(--sf-accent-rgb), 0.1); 
      color: var(--sf-accent); 
    }
    
    .shadow-premium {
      box-shadow: 0 20px 40px -15px rgba(147, 51, 234, 0.15);
    }

    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class TeamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private themeService = inject(ThemeService);

  performance = signal<any>(null);
  expandedMember = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadPerformance(params['id']);
      }
    });
  }

  loadPerformance(id: string) {
    const quarterId = this.themeService.currentQuarter();
    this.teamService.getTargetSummary(id, quarterId).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.performance.set(res.data);
      }
    });
  }

  toggleExpand(memberId: string) {
    if (this.expandedMember() === memberId) {
      this.expandedMember.set(null);
    } else {
      this.expandedMember.set(memberId);
    }
  }
}
