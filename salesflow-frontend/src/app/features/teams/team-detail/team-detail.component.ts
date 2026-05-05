import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService } from '@core/services/team.service';
import { ThemeService } from '@core/services/theme.service';
import { ApiResponse } from '@core/models/api-response.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroArrowRight, heroUserGroup, heroTrophy, heroChartBar, 
  heroUsers, heroBuildingOffice, heroCalendar, heroChevronDown, 
  heroChevronUp, heroPencilSquare, heroIdentification
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, NgIconComponent, RouterLink],
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

      <!-- Team Overview Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-sf-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
          <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">إجمالي مبيعات الفريق</p>
          <div class="flex items-end justify-between relative z-10">
            <h4 class="text-3xl font-display font-black text-sf-text">{{ perf.totalAchieved | number }} <span class="text-xs opacity-50">ج.م</span></h4>
            <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
              <ng-icon name="heroTrophy"></ng-icon>
            </div>
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-sf-accent/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
          <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">المستهدف المعدل</p>
          <div class="flex items-end justify-between relative z-10">
            <h4 class="text-3xl font-display font-black text-sf-text">{{ perf.totalAdjustedTarget | number }} <span class="text-xs opacity-50">ج.م</span></h4>
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
                    <span class="text-sf-primary">المستهدف: {{ member.adjustedTarget | number }} ج.م</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-8">
                <div class="text-right">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-1">المحقق</p>
                  <p class="text-lg font-black text-sf-success">{{ member.achieved | number }} ج.م</p>
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
                        <p class="text-sm font-black text-sf-primary">{{ sale.unitValue | number }} <span class="text-[9px]">ج.م</span></p>
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
