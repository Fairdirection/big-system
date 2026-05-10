import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamService } from '@core/services/team.service';
import { ThemeService } from '@core/services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroUserGroup, heroUser, heroTrophy, heroChevronRight, heroMagnifyingGlass, heroChartBar, heroUsers, heroTrash, heroPencilSquare } from '@ng-icons/heroicons/outline';
import { RouterLink, Router } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { ApiResponse } from '@core/models/api-response.model';
import { Team } from '@core/models/team.model';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, NgIconComponent, RouterLink, CurrencyEgpPipe],
  providers: [
    provideIcons({ heroPlus, heroUserGroup, heroUser, heroTrophy, heroChevronRight, heroMagnifyingGlass, heroChartBar, heroUsers, heroTrash, heroPencilSquare })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">فرق المبيعات</h1>
          <p class="text-sf-muted font-medium mt-1">إدارة هيكلة المجموعات ومتابعة أداء قادة الفرق في الربع الحالي.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2 shadow-glow-sm">
          <ng-icon name="heroPlus"></ng-icon>
          <span>إنشاء فريق جديد</span>
        </button>
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

      <!-- Stats Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-card p-4 rounded-2xl border border-sf-border flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
            <ng-icon name="heroUserGroup"></ng-icon>
          </div>
          <div>
            <p class="text-[10px] font-bold text-sf-muted uppercase">إجمالي الفرق</p>
            <p class="text-lg font-black text-sf-text">{{ teams().length }}</p>
          </div>
        </div>
        <div class="glass-card p-4 rounded-2xl border border-sf-border flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-sf-success/10 flex items-center justify-center text-sf-success">
            <ng-icon name="heroTrophy"></ng-icon>
          </div>
          <div>
            <p class="text-[10px] font-bold text-sf-muted uppercase">متوسط الإنجاز</p>
            <p class="text-lg font-black text-sf-text">{{ averageAchievement() | number:'1.0-1' }}%</p>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-col md:flex-row items-center gap-4 bg-sf-surface/50 p-4 rounded-2xl border border-sf-border shadow-xl backdrop-blur-md">
        <div class="relative flex-1 w-full group">
          <ng-icon name="heroMagnifyingGlass" class="absolute right-4 top-1/2 -translate-y-1/2 text-sf-muted group-focus-within:text-sf-primary transition-colors"></ng-icon>
          <input type="text" (input)="onSearch($event)" placeholder="بحث باسم الفريق أو اسم القائد..." 
                 class="w-full pr-11 pl-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 transition-all outline-none">
        </div>
      </div>

      <!-- Teams Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8" *ngIf="!loading(); else skeleton">
        @for (team of filteredTeams(); track team._id) {
          <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl hover:border-sf-primary/40 transition-all group relative overflow-hidden">
            <!-- Background Accent -->
            <div class="absolute -right-12 -top-12 w-32 h-32 bg-sf-primary/5 rounded-full blur-3xl group-hover:bg-sf-primary/10 transition-colors"></div>

            <div class="flex items-start justify-between mb-8 relative z-10">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-sf-surface border border-sf-border flex items-center justify-center text-sf-primary shadow-inner relative">
                  <ng-icon name="heroUserGroup" class="text-3xl"></ng-icon>
                  <div class="absolute -top-2 -left-2 px-2 py-0.5 bg-sf-bg border border-sf-border rounded-md text-[8px] font-black text-sf-muted uppercase tracking-tighter">
                    ID: {{ team._id.slice(-4) }}
                  </div>
                </div>
                <div>
                  <h3 [routerLink]="['/teams', team._id]" 
                      class="text-xl font-display font-bold text-sf-text hover:text-sf-primary transition-colors cursor-pointer decoration-sf-primary/30 hover:underline underline-offset-8">
                    {{ team.name }}
                  </h3>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span class="flex items-center gap-1 text-[10px] font-black text-sf-muted uppercase tracking-widest bg-sf-bg px-2 py-0.5 rounded border border-sf-border">
                      <ng-icon name="heroUsers" class="text-xs"></ng-icon>
                      {{ team.memberIds.length || 0 }} {{ team.teamLeaderId.seniorityLevel === 'SalesManager' ? 'قادة' : 'أعضاء' }}
                    </span>
                    <span *ngIf="team.teamLeaderId.seniorityLevel === 'SalesManager'" class="text-[10px] font-black text-sf-secondary uppercase tracking-widest bg-sf-secondary/10 px-2 py-0.5 rounded border border-sf-secondary/20">
                      مجموعة إدارة
                    </span>
                    <span *ngIf="team.teamLeaderId.managerId?.name" class="text-[10px] font-black text-sf-primary uppercase tracking-widest bg-sf-primary/10 px-2 py-0.5 rounded border border-sf-primary/20">
                      تحت إدارة: {{ team.teamLeaderId.managerId?.name }}
                    </span>
                    <span class="text-[10px] font-black text-sf-success uppercase tracking-widest bg-sf-success/10 px-2 py-0.5 rounded border border-sf-success/20">
                      نشط
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button [routerLink]="['/teams', team._id, 'edit']"
                        class="p-2.5 rounded-xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-primary hover:bg-sf-primary/10 hover:scale-110 transition-all shadow-sm hover:shadow-glow-sm active:scale-95">
                  <ng-icon name="heroPencilSquare" class="text-lg"></ng-icon>
                </button>
                <button (click)="confirmDelete(team._id)" 
                        class="p-2.5 rounded-xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-danger hover:bg-sf-danger/10 hover:scale-110 transition-all shadow-sm hover:shadow-glow-danger active:scale-95">
                  <ng-icon name="heroTrash" class="text-lg"></ng-icon>
                </button>
              </div>
            </div>

            <!-- Performance Mini-Chart -->
            <div class="mb-8 space-y-3 relative z-10">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-sf-muted uppercase tracking-widest">إنجاز المستهدف</span>
                <span class="font-black text-sf-primary">{{ (team.performance?.overallAchievementPercentage || 0) | number:'1.0-1' }}%</span>
              </div>
              <div class="h-2.5 w-full bg-sf-surface rounded-full border border-sf-border/50 overflow-hidden p-0.5">
                <div class="h-full bg-gradient-to-r from-sf-primary to-sf-secondary rounded-full transition-all duration-1000 shadow-glow-sm"
                     [style.width.%]="team.performance?.overallAchievementPercentage || 0"></div>
              </div>
              <div class="flex justify-between items-center text-[10px] font-bold text-sf-muted uppercase">
                <span>محقق: {{ (team.performance?.totalAchieved || 0) | currencyEgp }}</span>
                <span>المستهدف: {{ (team.performance?.totalAdjustedTarget || 0) | currencyEgp }}</span>
              </div>
            </div>


            <!-- Team Leader Footer -->
            <div class="mt-8 p-4 bg-sf-surface/50 border border-sf-border rounded-2xl flex items-center justify-between relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sf-bg border border-sf-border flex items-center justify-center text-sf-primary font-display font-black text-sm group-hover:bg-sf-primary group-hover:text-white transition-colors">
                  {{ team.teamLeaderId.name.charAt(0) || 'L' }}
                </div>
                <div>
                  <p class="text-[10px] font-bold text-sf-muted uppercase tracking-widest leading-none mb-1">
                    {{ team.teamLeaderId.seniorityLevel === 'SalesManager' ? 'مدير المبيعات' : 'قائد الفريق' }}
                  </p>
                  <p class="text-sm font-bold text-sf-text leading-none">{{ team.teamLeaderId.name || 'غير معين' }}</p>
                </div>
              </div>
              <div *ngIf="(team.performance?.overallAchievementPercentage || 0) > 80" 
                   class="flex items-center gap-1.5 px-3 py-1.5 bg-sf-warning/10 border border-sf-warning/20 rounded-xl">
                <ng-icon name="heroTrophy" class="text-sf-warning text-sm"></ng-icon>
                <span class="text-[10px] font-black text-sf-warning uppercase tracking-tighter">نجم الربع</span>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-32 flex flex-col items-center justify-center text-sf-muted border-2 border-dashed border-sf-border rounded-3xl bg-sf-surface/20">
            <ng-icon name="heroUserGroup" class="text-6xl mb-4 opacity-10"></ng-icon>
            <h3 class="text-xl font-bold">لم يتم العثور على فرق</h3>
            <p class="text-sm font-medium">حاول تغيير كلمة البحث أو ابدأ بإنشاء فريق جديد.</p>
          </div>
        }
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="showDeleteModal()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="absolute inset-0 bg-sf-bg/80 backdrop-blur-md" (click)="closeDeleteModal()"></div>
        <div class="glass-card w-full max-w-md p-8 rounded-[2rem] border border-sf-border shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div class="w-20 h-20 rounded-3xl bg-sf-danger/10 text-sf-danger flex items-center justify-center mx-auto mb-6">
            <ng-icon name="heroTrash" class="text-4xl"></ng-icon>
          </div>
          <h2 class="text-2xl font-display font-bold text-sf-text text-center mb-2">تأكيد حذف الفريق</h2>
          <p class="text-sf-muted text-center font-medium mb-8">
            هل أنت متأكد من رغبتك في حذف هذا الفريق؟ 
            <span class="block mt-1 text-xs text-sf-danger font-black uppercase">سيتم فك ارتباط جميع الأعضاء تلقائياً.</span>
          </p>
          <div class="grid grid-cols-2 gap-4">
            <button (click)="closeDeleteModal()" class="py-4 rounded-2xl bg-sf-surface border border-sf-border text-sf-text font-bold hover:bg-sf-bg transition-all">
              إلغاء
            </button>
            <button (click)="onDelete()" class="py-4 rounded-2xl bg-sf-danger text-white font-bold shadow-glow-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
              <ng-icon name="heroTrash"></ng-icon>
              <span>تأكيد الحذف</span>
            </button>
          </div>
        </div>
      </div>

      <ng-template #skeleton>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div *ngFor="let i of [1,2,3,4]" class="h-80 bg-sf-surface rounded-3xl border border-sf-border"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .shadow-glow-sm {
      box-shadow: 0 0 15px rgba(147, 51, 234, 0.3);
    }
    .shadow-glow-danger {
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class TeamListComponent implements OnInit {
  private teamService = inject(TeamService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  
  teams = signal<Team[]>([]);
  searchTerm = signal('');
  loading = signal(true);

  filteredTeams = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.teams();
    return this.teams().filter(t => 
      t.name?.toLowerCase().includes(term) || 
      t.teamLeaderId?.name?.toLowerCase().includes(term)
    );
  });

  showDeleteModal = signal(false);
  deletingId = signal<string | null>(null);

  averageAchievement = computed(() => {
    const teams = this.teams();
    if (teams.length === 0) return 0;
    const total = teams.reduce((acc, t) => acc + (t.performance?.overallAchievementPercentage || 0), 0);
    return Math.round(total / teams.length);
  });

  constructor() {
    effect(() => {
      const q = this.themeService.currentQuarter();
      this.loadTeamsWithPerformance(q);
    });
  }

  ngOnInit() {}

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  loadTeamsWithPerformance(quarterId: string) {
    this.themeService.loading.set(true);
    this.loading.set(true);

    this.teamService.getTeams({ includePerformance: 'true', quarterId }).subscribe({
      next: (res) => {
        if (res.success) {
          this.teams.set(res.data);
        }
        this.loading.set(false);
        this.themeService.loading.set(false);
      },
      error: () => this.handleError()
    });
  }

  confirmDelete(id: string) {
    this.deletingId.set(id);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletingId.set(null);
  }

  onDelete() {
    const id = this.deletingId();
    if (!id) return;

    this.themeService.loading.set(true);
    this.teamService.deleteTeam(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.teams.update(prev => prev.filter(t => t._id !== id));
          this.closeDeleteModal();
        }
        this.themeService.loading.set(false);
      },
      error: () => {
        this.themeService.loading.set(false);
        this.closeDeleteModal();
      }
    });
  }

  onNavigate(id: string, event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    this.router.navigate(['/teams', id]);
  }

  private handleError() {
    this.loading.set(false);
    this.themeService.loading.set(false);
  }
}
