import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ThemeService } from '@core/services/theme.service';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ApiResponse } from '@core/models/api-response.model';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { 
  heroChartBar, 
  heroArrowTrendingUp, 
  heroUsers, 
  heroFire, 
  heroInformationCircle, 
  heroPencilSquare, 
  heroCheck, 
  heroXMark 
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-target-list',
  standalone: true,
  imports: [CommonModule, CurrencyEgpPipe, NgIconComponent, TranslateModule],
  providers: [
    provideIcons({ 
      heroChartBar, 
      heroArrowTrendingUp, 
      heroUsers, 
      heroFire, 
      heroInformationCircle, 
      heroPencilSquare, 
      heroCheck, 
      heroXMark 
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in" *ngIf="summary() as data; else loading">
      <!-- Toast Notification -->
      <div *ngIf="saveSuccessMessage()" class="fixed top-24 left-6 z-[110] bg-sf-success text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in-left border border-white/20 text-right">
        <ng-icon name="heroCheck" class="text-xl"></ng-icon>
        <span class="font-bold text-sm">{{ saveSuccessMessage() }}</span>
      </div>

      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">{{ 'target.title' | translate }}</h1>
          <p class="text-sf-muted font-medium mt-1">{{ 'target.subtitle' | translate }}</p>
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
            <span class="block text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ 'target.total_dept' | translate }}</span>
            <span class="text-xl font-black text-sf-text">{{ data.totals.totalAdjustedTarget | currencyEgp }}</span>
          </div>
        </div>
        
        <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-xl flex items-center gap-5">
          <div class="w-12 h-12 rounded-xl bg-sf-info/20 flex items-center justify-center text-sf-info border border-sf-info/30">
            <ng-icon name="heroArrowTrendingUp" class="text-2xl"></ng-icon>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ 'target.overall_achievement' | translate }}</span>
            <span class="text-xl font-black text-sf-info">{{ data.totals.overallAchievementPercentage }}%</span>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-xl flex items-center gap-5">
          <div class="w-12 h-12 rounded-xl bg-sf-warning/20 flex items-center justify-center text-sf-warning border border-sf-warning/30">
            <ng-icon name="heroUsers" class="text-2xl"></ng-icon>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ 'target.sales_employees' | translate }}</span>
            <span class="text-xl font-black text-sf-text">{{ data.employees.length }}</span>
          </div>
        </div>
      </div>

      <!-- Individual Targets List -->
      <div class="glass-card rounded-3xl border border-sf-border shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-sf-border/30 bg-sf-surface/50 flex items-center justify-between">
          <h3 class="text-lg font-display font-bold text-sf-text flex items-center gap-3">
            <ng-icon name="heroUsers" class="text-sf-primary"></ng-icon>
            {{ 'target.progress_title' | translate }}
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
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ emp.teamName || ('target.no_team' | translate) }}</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="flex-1 w-full">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ 'target.achievement_rate' | translate }}</span>
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
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ 'target.achieved' | translate }}</span>
                    <span class="text-sm font-black text-sf-text">{{ emp.achievedSales | currencyEgp }}</span>
                  </div>
                  <div class="flex flex-col text-left">
                    <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ 'target.target' | translate }}</span>
                    <span class="text-sm font-black text-sf-subtle">{{ emp.adjustedTarget | currencyEgp }}</span>
                  </div>
                </div>

                <!-- Edit Action -->
                <div class="flex items-center justify-end">
                  <button (click)="openEditModal(emp)" 
                          class="p-2.5 rounded-xl bg-sf-primary/10 hover:bg-sf-primary text-sf-primary hover:text-white border border-sf-primary/20 transition-all flex items-center justify-center"
                          title="تعديل المستهدف">
                    <ng-icon name="heroPencilSquare" class="text-lg"></ng-icon>
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="py-24 text-center opacity-30">
              <ng-icon name="heroChartBar" class="text-5xl mb-3"></ng-icon>
              <p class="font-bold uppercase tracking-widest text-sm">{{ 'target.no_data' | translate }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Edit Target Modal -->
      <div *ngIf="isModalOpen()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="absolute inset-0 bg-sf-bg/85 backdrop-blur-md" (click)="closeModal()"></div>
        <div class="glass-card w-full max-w-md p-8 rounded-[2rem] border border-sf-border shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 text-right">
          <header class="flex items-center justify-between pb-4 border-b border-sf-border/30 mb-6">
            <h3 class="text-xl font-display font-bold text-sf-text">{{ 'target.edit_title' | translate }}</h3>
            <button (click)="closeModal()" class="p-1.5 rounded-lg hover:bg-sf-surface text-sf-muted hover:text-sf-text transition-all">
              <ng-icon name="heroXMark" class="text-lg"></ng-icon>
            </button>
          </header>

          <div class="space-y-6">
            <!-- Employee Info Box -->
            <div class="p-4 bg-sf-surface/50 rounded-2xl border border-sf-border flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-sf-primary/10 border border-sf-primary/20 flex items-center justify-center text-sf-primary font-black text-sm">
                {{ selectedEmployee()?.employeeName?.charAt(0) }}
              </div>
              <div>
                <h4 class="text-sm font-bold text-sf-text">{{ selectedEmployee()?.employeeName }}</h4>
                <p class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">{{ selectedEmployee()?.teamName || ('target.no_team' | translate) }}</p>
              </div>
            </div>

            <!-- Input Form Field -->
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">{{ 'target.edit_label' | translate }}</label>
              <input type="number" 
                     [value]="editTargetValue()" 
                     (input)="onTargetValueChange($event)"
                     placeholder="مثال: 500000"
                     class="w-full px-4 py-3.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 outline-none transition-all font-semibold font-mono-numbers text-sf-text">
              <p class="text-[10px] text-sf-muted mr-1">{{ 'target.edit_hint' | translate }}</p>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage()" class="p-4 bg-sf-danger/10 border border-sf-danger/20 rounded-2xl text-sf-danger text-xs font-semibold flex items-center gap-2">
              <ng-icon name="heroInformationCircle"></ng-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-4 mt-8">
              <button type="button" (click)="closeModal()" class="py-4 rounded-2xl bg-sf-surface border border-sf-border text-sf-text font-bold hover:bg-sf-bg transition-all font-semibold">
                {{ 'target.edit_cancel' | translate }}
              </button>
              <button type="button"
                      (click)="saveTarget()"
                      [disabled]="isSaving()"
                      class="py-4 rounded-2xl bg-sf-primary text-white font-bold shadow-glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <ng-icon [name]="isSaving() ? 'heroFire' : 'heroCheck'" [class.animate-pulse]="isSaving()"></ng-icon>
                <span>{{ isSaving() ? ('common.saving' | translate) : ('target.edit_confirm' | translate) }}</span>
              </button>
            </div>
          </div>
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
    @keyframes slide-in-left { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-in-left { animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .shadow-glow-sm { box-shadow: 0 0 10px rgba(147, 51, 234, 0.3); }
    .shadow-glow-purple { box-shadow: 0 0 15px rgba(147, 51, 234, 0.3); }
  `]
})
export class TargetListComponent {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  private translate = inject(TranslateService);

  summary = signal<any>(null);
  currentQuarter = this.themeService.currentQuarter;
  availableQuarters = this.themeService.availableQuarters;

  // Edit Modal Signals
  isModalOpen = signal(false);
  selectedEmployee = signal<any>(null);
  editTargetValue = signal<number | string>('');
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  saveSuccessMessage = signal<string | null>(null);

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
    const ts = new Date().getTime();
    this.http.get<ApiResponse<any>>(`${environment.apiUrl}/targets/summary`, {
      params: { quarterId, t: ts.toString() }
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

  openEditModal(emp: any) {
    this.selectedEmployee.set(emp);
    this.editTargetValue.set(emp.fullTarget || '');
    this.errorMessage.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEmployee.set(null);
  }

  onTargetValueChange(event: any) {
    this.editTargetValue.set(event.target.value);
  }

  saveTarget() {
    const emp = this.selectedEmployee();
    if (!emp) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const rawVal = this.editTargetValue();
    const val = rawVal === '' ? null : Number(rawVal);

    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/targets/employee/${emp.employeeId}`, {
      target: val,
      quarterId: this.currentQuarter()
    }).subscribe({
      next: res => {
        this.isSaving.set(false);
        if (res.success) {
          this.closeModal();
          this.showToast(this.translate.instant('target.updated_success'));
          this.loadSummary(this.currentQuarter());
        } else {
          this.errorMessage.set(res.message || this.translate.instant('target.error_save'));
        }
      },
      error: err => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || this.translate.instant('common.error_generic'));
      }
    });
  }

  showToast(msg: string) {
    this.saveSuccessMessage.set(msg);
    setTimeout(() => {
      this.saveSuccessMessage.set(null);
    }, 4000);
  }

  formatQ(q: string) {
    return formatQuarter(q);
  }
}
