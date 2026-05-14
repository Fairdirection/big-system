import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EmployeeService } from '@core/services/employee.service';
import { ThemeService } from '@core/services/theme.service';
import { Employee } from '@core/models/employee.model';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroPlus,
  heroMagnifyingGlass,
  heroIdentification,
  heroEnvelope,
  heroPhone,
  heroChevronRight,
  heroCalendarDays,
  heroChartBar
} from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { environment } from '@env/environment';
import { formatQuarter } from '@core/utils/quarter.utils';

interface EmployeeWithQuarterlyTarget extends Employee {
  _quarterlyTarget?: number | null;   // adjusted target for active quarter
  _hasCustomTarget?: boolean;          // true when a custom override exists in DB
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({
      heroPlus,
      heroMagnifyingGlass,
      heroIdentification,
      heroEnvelope,
      heroPhone,
      heroChevronRight,
      heroCalendarDays,
      heroChartBar
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-display font-bold text-sf-text tracking-tight">المؤسسة</h1>
          <p class="text-sf-muted font-medium mt-1 text-sm">إدارة أعضاء الفريق، الأقسام، ومستهدفات المبيعات.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2 self-start sm:self-auto">
          <ng-icon name="heroPlus"></ng-icon>
          <span>إضافة موظف</span>
        </button>
      </header>

      <!-- Filter Bar -->
      <div class="flex flex-col gap-3 bg-sf-surface/50 p-4 rounded-2xl border border-sf-border shadow-xl">
        <!-- Search -->
        <div class="relative w-full group">
          <ng-icon name="heroMagnifyingGlass" class="absolute right-4 top-1/2 -translate-y-1/2 text-sf-muted group-focus-within:text-sf-primary transition-colors text-lg"></ng-icon>
          <input type="text" placeholder="بحث بالاسم، الكود أو البريد..."
                 (input)="onSearch($event)"
                 class="w-full pr-11 pl-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 transition-all outline-none">
        </div>

        <!-- Status + count row -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Status Filter Tabs -->
          <div class="flex items-center gap-1 bg-sf-bg p-1 rounded-xl border border-sf-border flex-1 min-w-0 overflow-x-auto">
            <button (click)="changeStatusFilter('active')"
                    [class]="statusFilter() === 'active' ? 'flex-1 px-3 py-1.5 bg-sf-primary text-white rounded-lg text-xs font-bold transition-all shadow-glow-sm whitespace-nowrap' : 'flex-1 px-3 py-1.5 text-sf-muted hover:text-sf-text rounded-lg text-xs font-bold transition-all whitespace-nowrap'">
              النشطون
            </button>
            <button (click)="changeStatusFilter('inactive')"
                    [class]="statusFilter() === 'inactive' ? 'flex-1 px-3 py-1.5 bg-sf-primary text-white rounded-lg text-xs font-bold transition-all shadow-glow-sm whitespace-nowrap' : 'flex-1 px-3 py-1.5 text-sf-muted hover:text-sf-text rounded-lg text-xs font-bold transition-all whitespace-nowrap'">
              غير النشطين
            </button>
            <button (click)="changeStatusFilter('all')"
                    [class]="statusFilter() === 'all' ? 'flex-1 px-3 py-1.5 bg-sf-primary text-white rounded-lg text-xs font-bold transition-all shadow-glow-sm whitespace-nowrap' : 'flex-1 px-3 py-1.5 text-sf-muted hover:text-sf-text rounded-lg text-xs font-bold transition-all whitespace-nowrap'">
              الكل
            </button>
          </div>

          <!-- Total + Quarter badges -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="px-3 py-2 bg-sf-bg border border-sf-border rounded-xl text-xs font-semibold text-sf-text whitespace-nowrap">
              <span class="text-sf-muted ml-1">الإجمالي:</span>{{ filteredEmployees().length }}
            </div>
            <div class="px-3 py-2 bg-sf-primary/10 border border-sf-primary/20 rounded-xl text-xs font-bold text-sf-primary whitespace-nowrap">
              {{ formatQ(currentQuarter()) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" *ngIf="!loading(); else skeleton">
        @for (emp of filteredEmployees(); track emp._id) {
          <div class="glass-card p-5 rounded-2xl border border-sf-border shadow-xl hover:border-sf-primary/50 transition-all group cursor-pointer flex flex-col gap-4"
               [routerLink]="[emp._id]">

            <!-- Top Row: Avatar + Name + Badge -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl bg-gradient-purple flex items-center justify-center text-white text-lg font-display font-black shadow-glow-sm shrink-0">
                {{ emp.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-sf-text group-hover:text-sf-primary transition-colors truncate leading-tight">{{ emp.name }}</h3>
                <span class="text-[10px] font-bold text-sf-muted uppercase tracking-widest">{{ emp.code }}</span>
              </div>
              <app-badge [color]="emp.isActive ? 'success' : 'gray'" class="shrink-0">{{ emp.isActive ? 'نشط' : 'غير نشط' }}</app-badge>
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
                  تاريخ التعيين
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
                الملف الشخصي
                <ng-icon name="heroChevronRight" class="rotate-180 text-sm"></ng-icon>
              </button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-24 flex flex-col items-center justify-center text-sf-muted text-center">
            <div class="w-20 h-20 rounded-full bg-sf-surface flex items-center justify-center mb-6 border border-sf-border border-dashed animate-pulse">
              <ng-icon name="heroIdentification" class="text-4xl opacity-20"></ng-icon>
            </div>
            <h3 class="text-xl font-bold">لم يتم العثور على موظفين</h3>
            <p class="text-sm mt-1">تأكد من كتابة الاسم بشكل صحيح أو ابدأ بإضافة موظفين جدد.</p>
          </div>
        }
      </div>

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

  employees = signal<EmployeeWithQuarterlyTarget[]>([]);
  searchTerm = signal('');
  statusFilter = signal<'active' | 'inactive' | 'all'>('active');
  loading = signal(true);
  filteredEmployees = signal<EmployeeWithQuarterlyTarget[]>([]);
  currentQuarter = this.themeService.currentQuarter;

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

    this.employeeService.getEmployees().subscribe({
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
    this.http.get<any>(`${environment.apiUrl}/targets/overrides`, { params: { quarterId } }).subscribe({
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

  onSearch(event: any) {
    this.searchTerm.set(event.target.value.toLowerCase());
    this.applyFilters();
  }

  changeStatusFilter(filter: 'active' | 'inactive' | 'all') {
    this.statusFilter.set(filter);
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
