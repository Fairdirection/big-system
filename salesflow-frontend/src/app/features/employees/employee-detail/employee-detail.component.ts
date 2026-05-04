import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '@core/services/employee.service';
import { ThemeService } from '@core/services/theme.service';
import { Employee } from '@core/models/employee.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroChevronRight, 
  heroPencil, 
  heroEnvelope, 
  heroPhone, 
  heroBriefcase, 
  heroCalendarDays,
  heroIdentification,
  heroTrophy,
  heroChartBar,
  heroUsers
} from '@ng-icons/heroicons/outline';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { SaleListComponent } from '../../sales/sale-list/sale-list.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, NgIconComponent, RouterLink, BadgeComponent, CurrencyEgpPipe, SaleListComponent],
  providers: [
    provideIcons({ 
      heroChevronRight, 
      heroPencil, 
      heroEnvelope, 
      heroPhone, 
      heroBriefcase, 
      heroCalendarDays,
      heroIdentification,
      heroTrophy,
      heroChartBar,
      heroUsers
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in pb-20" *ngIf="employee() as emp">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <button (click)="goBack()" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>
          
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-3xl bg-gradient-purple flex items-center justify-center text-white text-3xl font-bold shadow-glow-purple">
              {{ emp.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-3xl font-display font-bold text-sf-text">{{ emp.name }}</h1>
                <app-badge [color]="emp.isActive ? 'success' : 'gray'">
                  {{ emp.isActive ? 'نشط' : 'غير نشط' }}
                </app-badge>
              </div>
              <p class="text-sf-muted font-medium mt-1 flex items-center gap-2">
                <span class="bg-sf-surface px-2 py-0.5 rounded border border-sf-border text-[10px] font-black uppercase tracking-widest text-sf-primary">
                  {{ emp.code }}
                </span>
                <span class="text-sf-subtle">•</span>
                <span>{{ emp.jobTitle || 'مسؤول مبيعات' }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button [routerLink]="['edit']" class="btn btn-secondary flex items-center gap-2 px-6">
            <ng-icon name="heroPencil"></ng-icon>
            <span>تعديل الملف</span>
          </button>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="glass-card p-6 border border-sf-border flex flex-col items-center text-center group relative">
          <div class="w-12 h-12 rounded-2xl bg-sf-primary/10 border border-sf-primary/20 flex items-center justify-center text-sf-primary mb-4">
            <ng-icon name="heroTrophy" class="text-xl"></ng-icon>
          </div>
          <span class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">المستهدف الربعي</span>
          <span class="text-xl font-black text-sf-text">{{ emp.target | currencyEgp }}</span>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">المستهدف المخطط للربع الحالي</p>
        </div>

        <div class="glass-card p-6 border border-sf-border flex flex-col items-center text-center group relative">
          <div class="w-12 h-12 rounded-2xl bg-sf-info/10 border border-sf-info/20 flex items-center justify-center text-sf-info mb-4">
            <ng-icon name="heroChartBar" class="text-xl"></ng-icon>
          </div>
          <span class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">المبيعات المحققة</span>
          <span class="text-xl font-black text-sf-text">{{ (stats()?.achievedSales || 0) | currencyEgp }}</span>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">إجمالي قيمة التعاقدات المنفذة</p>
        </div>

        <div class="glass-card p-6 border border-sf-border flex flex-col items-center text-center group relative">
          <div class="w-12 h-12 rounded-2xl bg-sf-success/10 border border-sf-success/20 flex items-center justify-center text-sf-success mb-4">
            <ng-icon name="heroChartBar" class="text-xl"></ng-icon>
          </div>
          <span class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">نسبة الإنجاز</span>
          <span class="text-xl font-black text-sf-success">{{ (stats()?.achievementPercentage || 0) }}%</span>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">مدى التقدم نحو المستهدف</p>
        </div>

        <div class="glass-card p-6 border border-sf-border flex flex-col items-center text-center group relative">
          <div class="w-12 h-12 rounded-2xl bg-sf-secondary/10 border border-sf-secondary/20 flex items-center justify-center text-sf-secondary mb-4">
            <ng-icon name="heroUsers" class="text-xl"></ng-icon>
          </div>
          <span class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">العملاء النشطون</span>
          <span class="text-xl font-black text-sf-text">{{ stats()?.clientsCount || 0 }}</span>
          <p class="absolute -bottom-5 right-2 text-[9px] text-sf-muted opacity-0 group-hover:opacity-100 transition-opacity">عدد العملاء المسجلين باسم الموظف</p>
        </div>
      </div>
      
      <!-- Employee Sales List -->
      <section class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-2 h-6 bg-sf-primary rounded-full"></div>
            <h3 class="text-xl font-display font-bold text-sf-text">سجل مبيعات الموظف</h3>
          </div>
        </div>
        <app-sale-list [employeeId]="employee()?._id || ''" [quarterId]="currentQuarter()"></app-sale-list>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Details -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Information Sections -->
          <section class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-8">
            <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
              <div class="w-2 h-6 bg-sf-primary rounded-full"></div>
              <h3 class="text-xl font-display font-bold text-sf-text">المعلومات الشخصية والوظيفية</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <!-- Item -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-muted">
                  <ng-icon name="heroEnvelope"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">البريد الإلكتروني</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.email }}</p>
                </div>
              </div>

              <!-- Item -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-muted">
                  <ng-icon name="heroPhone"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">رقم الهاتف</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.phone || '—' }}</p>
                </div>
              </div>

              <!-- Item -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-muted">
                  <ng-icon name="heroBriefcase"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">القسم</p>
                  <p class="text-sm font-bold text-sf-text">{{ translateDepartment(emp.department) }}</p>
                </div>
              </div>

              <!-- Item -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-muted">
                  <ng-icon name="heroCalendarDays"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">تاريخ التعيين</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.hireDate | date:'longDate' }}</p>
                </div>
              </div>

              <!-- Item: Total Days Worked -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-primary/60">
                  <ng-icon name="heroChartBar"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">إجمالي الأقدمية (من التعيين)</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-lg font-black text-sf-primary">{{ emp.currentSeniorityDays || 0 }}</span>
                    <span class="text-[10px] text-sf-muted font-bold">يوم</span>
                  </div>
                </div>
              </div>

              <!-- Item: Current Quarter Days -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-info/60">
                  <ng-icon name="heroCalendarDays"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">أيام العمل (الربع الحالي)</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-lg font-black text-sf-info">{{ emp.dynamicQuarterDays || 0 }}</span>
                    <span class="text-[10px] text-sf-muted font-bold">يوم / 90</span>
                  </div>
                </div>
              </div>

              <!-- Item -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-muted">
                  <ng-icon name="heroIdentification"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">الرقم القومي</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.nationalId || "—" }}</p>
                </div>
              </div>

              <!-- Item -->
              <div class="flex items-start gap-4">
                <div class="p-2.5 bg-sf-surface border border-sf-border rounded-xl text-sf-muted">
                  <ng-icon name="heroTrophy"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-widest mb-1">المستوى الوظيفي</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.seniorityLevel || 'مبتدئ' }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar Activity -->
        <div class="space-y-8">
          <section class="glass-card p-6 rounded-3xl border border-sf-border shadow-2xl space-y-6">
            <h3 class="text-sm font-black text-sf-muted uppercase tracking-widest">آخر النشاطات</h3>
            <div class="space-y-6">
              <div class="flex gap-4">
                <div class="relative">
                  <div class="w-2 h-2 rounded-full bg-sf-primary mt-1.5 z-10"></div>
                  <div class="absolute top-4 bottom-0 left-1 w-px bg-sf-border -mb-6"></div>
                </div>
                <div>
                  <p class="text-xs font-bold text-sf-text">إضافة مبيعة جديدة</p>
                  <p class="text-[10px] text-sf-muted mt-1">مشروع سكاي لاين • منذ ساعتين</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="relative">
                  <div class="w-2 h-2 rounded-full bg-sf-success mt-1.5 z-10"></div>
                  <div class="absolute top-4 bottom-0 left-1 w-px bg-sf-border -mb-6"></div>
                </div>
                <div>
                  <p class="text-xs font-bold text-sf-text">تحديث حالة مطالبة</p>
                  <p class="text-[10px] text-sf-muted mt-1">مطالبة رقم #1245 • منذ يوم</p>
                </div>
              </div>
              <div class="flex gap-4 opacity-50">
                <div class="w-2 h-2 rounded-full bg-sf-muted mt-1.5"></div>
                <div>
                  <p class="text-xs font-bold text-sf-text">تسجيل الدخول</p>
                  <p class="text-[10px] text-sf-muted mt-1">منذ 3 أيام</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="!employee()" class="py-32 flex flex-col items-center justify-center text-sf-muted animate-pulse">
      <div class="w-20 h-20 rounded-3xl bg-sf-surface border border-sf-border mb-6"></div>
      <div class="h-4 w-48 bg-sf-surface rounded-full mb-2"></div>
      <div class="h-3 w-32 bg-sf-surface rounded-full"></div>
    </div>
  `,
  styles: [`
    .glass-card { background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(12px); }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private themeService = inject(ThemeService);

  employee = signal<Employee | null>(null);
  currentQuarter = this.themeService.currentQuarter;
  stats = signal<any>(null);

  constructor() {
    // Re-fetch stats if quarter changes
    effect(() => {
      const q = this.themeService.currentQuarter();
      const id = this.employee()?._id || this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadStats(id, q);
      }
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeService.getEmployee(id).subscribe({
        next: (res) => {
          this.employee.set(res.data);
          this.loadStats(id, this.themeService.currentQuarter());
        },
        error: () => this.goBack()
      });
    }
  }

  loadStats(id: string, quarterId: string) {
    // Only Sales department has targets and performance stats
    if (this.employee()?.department !== 'Sales') {
      this.stats.set({
        achievedSales: 0,
        achievementPercentage: 0,
        clientsCount: 0
      });
      return;
    }

    this.themeService.loading.set(true);
    this.stats.set(null);
    this.employeeService.getTargetProgress(id, quarterId).subscribe({
      next: res => {
        this.themeService.loading.set(false);
        if (res.success) {
          this.stats.set(res.data);
        }
      },
      error: () => this.themeService.loading.set(false)
    });
  }

  translateDepartment(dept: string): string {
    const map: any = {
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

  goBack() {
    this.router.navigate(['/employees']);
  }
}

