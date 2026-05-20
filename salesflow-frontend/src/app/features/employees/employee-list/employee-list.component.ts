import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EmployeeService } from '@core/services/employee.service';
import { ThemeService } from '@core/services/theme.service';
import { Employee } from '@core/models/employee.model';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroPlus,
  heroIdentification,
  heroEnvelope,
  heroPhone,
  heroChevronRight,
  heroCalendarDays,
  heroChartBar,
  heroSquares2x2,
  heroTableCells,
} from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { environment } from '@env/environment';
import { formatQuarter } from '@core/utils/quarter.utils';
import { ListToolbarComponent } from '@shared/components/list-toolbar/list-toolbar.component';
import { TranslateModule } from '@ngx-translate/core';

interface EmployeeWithQuarterlyTarget extends Employee {
  _quarterlyTarget?: number | null;   // adjusted target for active quarter
  _hasCustomTarget?: boolean;          // true when a custom override exists in DB
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink, ListToolbarComponent, TranslateModule],
  providers: [
    provideIcons({
      heroPlus, heroIdentification, heroEnvelope, heroPhone,
      heroChevronRight, heroCalendarDays, heroChartBar,
      heroSquares2x2, heroTableCells,
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-display font-bold text-sf-text tracking-tight">{{ 'employee.list.title' | translate }}</h1>
          <p class="text-sf-muted font-medium mt-1 text-sm">إدارة أعضاء الفريق، الأقسام، ومستهدفات المبيعات.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2 self-start sm:self-auto">
          <ng-icon name="heroPlus"></ng-icon>
          <span>{{ 'employee.list.add' | translate }}</span>
        </button>
      </header>

      <!-- Toolbar row: ListToolbar + View toggle -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
        <div class="flex-1">
          <app-list-toolbar
            placeholder="بحث بالاسم، الكود أو البريد..."
            [statusOptions]="statusOptions"
            [activeStatus]="statusFilter()"
            [count]="filteredEmployees().length"
            [loading]="loading()"
            (searchChange)="onSearch($event)"
            (statusChange)="changeStatusFilter($event)"
          />
        </div>

        <!-- View toggle -->
        <div class="flex items-center gap-1 p-1 bg-sf-surface border border-sf-border rounded-2xl self-start flex-shrink-0 h-[50px] mt-0.5">
          <button (click)="viewMode.set('card')"
                  class="p-2 rounded-xl transition-all duration-200"
                  [class.bg-sf-primary]="viewMode() === 'card'"
                  [class.text-white]="viewMode() === 'card'"
                  [class.text-sf-muted]="viewMode() !== 'card'"
                  title="عرض البطاقات">
            <ng-icon name="heroSquares2x2" class="text-lg"></ng-icon>
          </button>
          <button (click)="viewMode.set('table')"
                  class="p-2 rounded-xl transition-all duration-200"
                  [class.bg-sf-primary]="viewMode() === 'table'"
                  [class.text-white]="viewMode() === 'table'"
                  [class.text-sf-muted]="viewMode() !== 'table'"
                  title="عرض القائمة">
            <ng-icon name="heroTableCells" class="text-lg"></ng-icon>
          </button>
        </div>
      </div>

      <!-- Employee Grid (card view) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
           *ngIf="!loading() && viewMode() === 'card'; else tableOrSkeleton">
        @for (emp of filteredEmployees(); track emp._id) {
          <div class="glass-card p-5 rounded-2xl border border-sf-border shadow-xl hover:border-sf-primary/50 transition-all group cursor-pointer flex flex-col gap-4"
               [routerLink]="[emp._id]">

            <!-- Top Row: Avatar + Name + Badge -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl shrink-0 overflow-hidden shadow-glow-sm">
                @if (emp.avatarUrl) {
                  <img [src]="emp.avatarUrl" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full bg-gradient-purple flex items-center justify-center text-white text-lg font-display font-black">
                    {{ emp.name.charAt(0) }}
                  </div>
                }
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-sf-text group-hover:text-sf-primary transition-colors truncate leading-tight">{{ emp.name }}</h3>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ emp.code }}</span>
              </div>
              <app-badge [color]="emp.isActive ? 'success' : 'gray'" class="shrink-0">{{ emp.isActive ? ('common.status_active' | translate) : ('common.status_inactive' | translate) }}</app-badge>
            </div>

            <!-- Department & Seniority -->
            <div class="flex items-center gap-2 text-xs text-sf-muted min-w-0">
              <ng-icon name="heroIdentification" class="text-sf-primary text-base shrink-0"></ng-icon>
              <span class="font-medium truncate">{{ translateDepartment(emp.department) }} • {{ translateSeniority(emp.seniorityLevel) }}</span>
            </div>

            <!-- Stats Row: Target + Hire Date -->
            <div class="grid gap-3 py-3 border-y border-sf-border/30"
                 [class.grid-cols-2]="emp.department === 'Sales'"
                 [class.grid-cols-1]="emp.department !== 'Sales'">
              @if (emp.department === 'Sales') {
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-[9px] font-bold text-sf-muted uppercase tracking-tighter flex items-center gap-1">
                    <ng-icon name="heroChartBar" class="text-sf-primary shrink-0"></ng-icon>
                    مستهدف {{ formatQ(currentQuarter()) }}
                  </span>
                  <span class="text-sm font-black text-sf-text truncate">{{ getEffectiveTarget(emp) | currencyEgp }}</span>
                  <!-- Quarter override indicator -->
                  @if (emp._hasCustomTarget) {
                    <span class="text-[9px] text-sf-primary font-bold">✦ مخصص للربع</span>
                  } @else {
                    <span class="text-[9px] text-sf-muted">افتراضي</span>
                  }
                </div>
              }
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="text-[9px] font-bold text-sf-muted uppercase tracking-tighter flex items-center gap-1">
                  <ng-icon name="heroCalendarDays" class="text-sf-primary shrink-0"></ng-icon>
                  {{ 'employee.list.hire_date' | translate }}
                </span>
                <span class="text-sm font-semibold text-sf-text truncate">{{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <!-- Actions Footer -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center gap-2">
                <button class="p-2 bg-sf-bg border border-sf-border rounded-lg text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 transition-all"
                        [title]="emp.email"
                        (click)="$event.stopPropagation()">
                  <ng-icon name="heroEnvelope" class="text-sm"></ng-icon>
                </button>
                <button class="p-2 bg-sf-bg border border-sf-border rounded-lg text-sf-muted hover:text-sf-primary hover:border-sf-primary/30 transition-all"
                        [title]="emp.phone"
                        (click)="$event.stopPropagation()">
                  <ng-icon name="heroPhone" class="text-sm"></ng-icon>
                </button>
              </div>
              <button class="flex items-center gap-1 text-[10px] font-black text-sf-primary uppercase tracking-widest group-hover:gap-2 transition-all shrink-0">
                {{ 'employee.detail.edit_btn' | translate }}
                <ng-icon name="heroChevronRight" class="rotate-180 text-sm"></ng-icon>
              </button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-24 flex flex-col items-center justify-center text-sf-muted text-center">
            <div class="w-20 h-20 rounded-full bg-sf-surface flex items-center justify-center mb-6 border border-sf-border border-dashed animate-pulse">
              <ng-icon name="heroIdentification" class="text-4xl opacity-20"></ng-icon>
            </div>
            <h3 class="text-xl font-bold">{{ 'employee.list.no_data' | translate }}</h3>
            <p class="text-sm mt-1">تأكد من كتابة الاسم بشكل صحيح أو ابدأ بإضافة موظفين جدد.</p>
          </div>
        }
      </div>

      <!-- Table view / Skeleton -->
      <ng-template #tableOrSkeleton>
        <ng-container *ngIf="!loading(); else skeleton">
          <!-- Table view -->
          <div class="glass-card rounded-2xl border border-sf-border overflow-hidden" *ngIf="viewMode() === 'table'">
            <div class="overflow-x-auto">
              <table class="w-full text-right border-collapse table-compact table-sticky-header">
                <thead>
                  <tr class="bg-sf-surface/50 border-b border-sf-border">
                    <th>{{ 'employee.list.title' | translate }}</th>
                    <th>القسم والمستوى</th>
                    <th class="text-left">{{ 'employee.list.target_progress' | translate }}</th>
                    <th>{{ 'employee.list.hire_date' | translate }}</th>
                    <th>{{ 'employee.list.status' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-sf-border/40">
                  @for (emp of filteredEmployees(); track emp._id) {
                    <tr class="group row-financial-hover cursor-pointer" [routerLink]="[emp._id]">
                      <td class="px-6 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden">
                            @if (emp.avatarUrl) {
                              <img [src]="emp.avatarUrl" class="w-full h-full object-cover" />
                            } @else {
                              <div class="w-full h-full bg-gradient-purple flex items-center justify-center text-white text-sm font-black">
                                {{ emp.name.charAt(0) }}
                              </div>
                            }
                          </div>
                          <div>
                            <p class="text-sm font-bold text-sf-text group-hover:text-sf-primary transition-colors">{{ emp.name }}</p>
                            <p class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ emp.code }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-3">
                        <p class="text-sm font-medium text-sf-text">{{ translateDepartment(emp.department) }}</p>
                        <p class="text-xs text-sf-muted">{{ translateSeniority(emp.seniorityLevel) }}</p>
                      </td>
                      <td class="px-6 py-3 text-left font-mono-numbers">
                        <span class="text-sm font-bold text-sf-text">{{ getEffectiveTarget(emp) | currencyEgp }}</span>
                      </td>
                      <td class="px-6 py-3">
                        <span class="text-sm font-medium text-sf-muted">{{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
                      </td>
                      <td class="px-6 py-3">
                        <app-badge [color]="emp.isActive ? 'success' : 'gray'">{{ emp.isActive ? ('common.status_active' | translate) : ('common.status_inactive' | translate) }}</app-badge>
                      </td>
                      <td class="px-6 py-3 text-left">
                        <ng-icon name="heroChevronRight" class="text-sf-muted rotate-180 text-sm"></ng-icon>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="py-16 text-center text-sf-muted">
                        <p class="font-bold">{{ 'employee.list.no_data' | translate }}</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </ng-container>
      </ng-template>

      <!-- Skeleton Loader -->
      <ng-template #skeleton>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div class="h-56 bg-sf-surface rounded-2xl border border-sf-border skeleton" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .shadow-glow-sm { box-shadow: 0 0 15px rgba(147, 51, 234, 0.2); }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private themeService = inject(ThemeService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  employees         = signal<EmployeeWithQuarterlyTarget[]>([]);
  searchTerm        = signal('');
  statusFilter      = signal<'active' | 'inactive' | 'all'>('active');
  loading           = signal(true);
  filteredEmployees = signal<EmployeeWithQuarterlyTarget[]>([]);
  viewMode          = signal<'card' | 'table'>('card');
  currentQuarter    = this.themeService.currentQuarter;

  readonly statusOptions = [
    { value: 'active',   label: 'النشطون' },
    { value: 'inactive', label: 'غير النشطين' },
    { value: 'all',      label: 'الكل' },
  ];

  constructor() {
    effect(() => {
      const q = this.themeService.currentQuarter();
      this.loadEmployees(q);
    });
  }

  ngOnInit() { }

  loadEmployees(quarterId?: string) {
    const quarter = quarterId || this.currentQuarter();
    this.themeService.loading.set(true);
    this.loading.set(true);

    this.employeeService.getEmployees().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        if (res.success) {
          const baseEmployees: EmployeeWithQuarterlyTarget[] = res.data.map(e => ({
            ...e,
            _quarterlyTarget: undefined
          }));
          this.employees.set(baseEmployees);
          this.applyFilters();

          // Now bulk-fetch quarterly targets for the current quarter
          this.loadQuarterlyTargets(baseEmployees, quarter);
        } else {
          this.themeService.loading.set(false);
          this.loading.set(false);
        }
      },
      error: () => {
        this.themeService.loading.set(false);
        this.loading.set(false);
      }
    });
  }

  loadQuarterlyTargets(baseEmployees: EmployeeWithQuarterlyTarget[], quarterId: string) {
    // Fetch the fast target overrides which contains per-employee quarterly targets
    this.http.get<any>(`${environment.apiUrl}/targets/overrides`, { params: { quarterId } }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.themeService.loading.set(false);
        this.loading.set(false);

        if (res.success && res.data) {
          const targetMap = new Map<string, { adjusted: number | null; hasCustom: boolean }>();
          for (const override of res.data) {
            targetMap.set(override.employeeId?.toString(), {
              adjusted: override.target ?? null,
              hasCustom: true
            });
          }

          const enriched = this.employees().map(emp => {
            const t = targetMap.get(emp._id.toString());
            return {
              ...emp,
              _quarterlyTarget: t ? t.adjusted : null,
              _hasCustomTarget: t ? t.hasCustom : false
            };
          });

          this.employees.set(enriched);
          this.applyFilters();
        }
      },
      error: () => {
        this.themeService.loading.set(false);
        this.loading.set(false);
      }
    });
  }

  /** Returns the effective display target — quarterly override if set, otherwise baseline. */
  getEffectiveTarget(emp: EmployeeWithQuarterlyTarget): number {
    if (emp._quarterlyTarget !== null && emp._quarterlyTarget !== undefined) {
      return emp._quarterlyTarget;
    }
    return emp.target ?? 0;
  }

  onSearch(query: string) {
    this.searchTerm.set(query.toLowerCase());
    this.applyFilters();
  }

  changeStatusFilter(filter: string) {
    this.statusFilter.set(filter as 'active' | 'inactive' | 'all');
    this.applyFilters();
  }

  applyFilters() {
    const term = this.searchTerm().toLowerCase();
    const filter = this.statusFilter();
    let list = this.employees();

    if (filter === 'active') list = list.filter(e => e.isActive);
    else if (filter === 'inactive') list = list.filter(e => !e.isActive);

    if (term) {
      list = list.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.code.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term)
      );
    }

    this.filteredEmployees.set(list);
  }

  formatQ(q: string): string {
    return formatQuarter(q);
  }

  translateDepartment(dept: string): string {
    const map: Record<string, string> = {
      'Sales': 'المبيعات',
      'Operations': 'العمليات',
      'Marketing': 'التسويق',
      'Finance': 'المالية',
      'IT': 'تكنولوجيا المعلومات',
      'HR': 'الموارد البشرية',
      'TopManagement': 'الإدارة العليا'
    };
    return map[dept] || dept;
  }

  translateSeniority(level: string | undefined): string {
    if (!level) return 'غير محدد';
    const map: Record<string, string> = {
      'Fresh': 'مبتدئ',
      'BA': 'مساعد (BA)',
      'BC': 'استشاري (BC)',
      'Senior': 'سينيور',
      'SV': 'مشرف',
      'TeamLeader': 'قائد فريق',
      'SalesManager': 'مدير مبيعات'
    };
    return map[level] || level;
  }
}
