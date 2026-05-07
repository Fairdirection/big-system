import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '@core/services/employee.service';
import { SaleService } from '@core/services/sale.service';
import { ThemeService } from '@core/services/theme.service';
import { Employee } from '@core/models/employee.model';
import { ApiResponse } from '@core/models/api-response.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroChevronLeft, heroChevronRight, heroPencil, heroTrash, heroEnvelope, heroPhone, 
  heroCalendar, heroBriefcase, heroClock, heroIdentification, heroTrophy, heroChartBar, 
  heroUsers, heroXMark, heroCheck, heroHashtag, heroMapPin, heroBuildingOffice
} from '@ng-icons/heroicons/outline';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, NgIconComponent, RouterLink, CurrencyEgpPipe],
  providers: [
    provideIcons({ 
      heroChevronLeft, heroChevronRight, heroPencil, heroTrash, heroEnvelope, heroPhone, 
      heroCalendar, heroBriefcase, heroClock, heroIdentification, heroTrophy, heroChartBar, 
      heroUsers, heroXMark, heroCheck, heroHashtag, heroMapPin, heroBuildingOffice
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
            <div class="w-20 h-20 rounded-3xl bg-sf-primary/10 flex items-center justify-center text-sf-primary text-3xl font-display font-black shadow-premium">
              {{ emp.name.charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">{{ emp.name }}</h1>
                <span class="badge" [class.badge-success]="emp.isActive" [class.badge-error]="!emp.isActive">
                  {{ emp.isActive ? 'نشط' : 'غير نشط' }}
                </span>
              </div>
              <p class="text-sf-muted font-bold flex items-center gap-2">
                <span class="text-sf-primary">{{ emp.jobTitle }}</span>
                <span class="opacity-30">•</span>
                <span>{{ emp.department }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button [routerLink]="['edit']" class="btn btn-secondary h-12 px-6">
            <ng-icon name="heroPencil"></ng-icon>
            <span>تعديل الملف</span>
          </button>
          
          @if (emp.isActive) {
            <button (click)="toggleActivation()" class="btn btn-secondary h-12 px-6">
              <ng-icon name="heroXMark"></ng-icon>
              <span>تعطيل الحساب</span>
            </button>
          } @else {
            <button (click)="toggleActivation()" class="btn btn-primary h-12 px-6">
              <ng-icon name="heroCheck"></ng-icon>
              <span>تفعيل الحساب</span>
            </button>
          }

          <button (click)="deleteEmployee()" class="btn btn-danger h-12 px-6 flex items-center gap-2">
            <ng-icon name="heroTrash"></ng-icon>
            <span>حذف الموظف</span>
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Stats & Info -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Quick Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-24 h-24 bg-sf-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
              <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">المستهدف المعدل</p>
              <div class="flex items-end justify-between relative z-10">
                <h4 class="text-2xl font-display font-black text-sf-text">{{ (stats()?.adjustedTarget || stats()?.fullTarget || emp.target) | currencyEgp }}</h4>
                <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
                  <ng-icon name="heroChartBar"></ng-icon>
                </div>
              </div>
            </div>

            <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-24 h-24 bg-sf-success/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
              <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">إجمالي المبيعات</p>
              <div class="flex items-end justify-between relative z-10">
                <h4 class="text-2xl font-display font-black text-sf-text">{{ (stats()?.achievedSales || 0) | currencyEgp }}</h4>
                <div class="w-10 h-10 rounded-xl bg-sf-success/10 flex items-center justify-center text-sf-success">
                  <ng-icon name="heroTrophy"></ng-icon>
                </div>
              </div>
            </div>

            <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-24 h-24 bg-sf-accent/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
              <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">نسبة الإنجاز</p>
              <div class="flex items-end justify-between relative z-10">
                <h4 class="text-2xl font-display font-black text-sf-text">{{ (stats()?.achievementPercentage || 0) | number:'1.0-1' }}%</h4>
                <div class="w-10 h-10 rounded-xl bg-sf-accent/10 flex items-center justify-center text-sf-accent">
                  <ng-icon name="heroChartBar"></ng-icon>
                </div>
              </div>
            </div>

            <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-24 h-24 bg-sf-warning/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
              <p class="text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-4">العملاء النشطين</p>
              <div class="flex items-end justify-between relative z-10">
                <h4 class="text-2xl font-display font-black text-sf-text">{{ stats()?.clientsCount || 0 }}</h4>
                <div class="w-10 h-10 rounded-xl bg-sf-warning/10 flex items-center justify-center text-sf-warning">
                  <ng-icon name="heroUsers"></ng-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Prorated Target Explanation Banner -->
          @if (stats()?.adjustedTarget && stats()?.adjustedTarget !== stats()?.fullTarget) {
            <div class="glass-card p-5 rounded-2xl border-r-4 border-r-sf-primary border-sf-border bg-sf-surface/60 flex items-center gap-4 shadow-md">
              <div class="w-10 h-10 rounded-xl bg-sf-primary/10 flex items-center justify-center text-sf-primary">
                <ng-icon name="heroClock"></ng-icon>
              </div>
              <div class="flex-1">
                <p class="text-xs font-black text-sf-text mb-0.5">تم تعديل المستهدف بما يتناسب مع أيام العمل</p>
                <p class="text-[10px] font-semibold text-sf-muted leading-relaxed">المستهدف الكامل للربع: {{ stats()?.fullTarget | currencyEgp }} • أيام العمل النشطة: {{ stats()?.actualWorkingDays }} يوم من أصل 90 يوم.</p>
              </div>
            </div>
          }

          <!-- Profile Details -->
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-xl">
            <h3 class="text-xl font-display font-black text-sf-text mb-8">معلومات الموظف</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div class="flex items-center gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors">
                  <ng-icon name="heroIdentification" class="text-xl"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">كود الموظف</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.code }}</p>
                </div>
              </div>

              <div class="flex items-center gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors">
                  <ng-icon name="heroEnvelope" class="text-xl"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">البريد الإلكتروني</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.email }}</p>
                </div>
              </div>

              <div class="flex items-center gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors">
                  <ng-icon name="heroPhone" class="text-xl"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">رقم الهاتف</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.phone }}</p>
                </div>
              </div>

              <div class="flex items-center gap-5 p-4 rounded-2xl bg-sf-surface border border-sf-border/40 hover:border-sf-primary/30 transition-colors group">
                <div class="w-12 h-12 rounded-xl bg-sf-primary/5 flex items-center justify-center text-sf-primary group-hover:bg-sf-primary/10 transition-colors">
                  <ng-icon name="heroCalendar" class="text-xl"></ng-icon>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider mb-0.5">تاريخ التعيين</p>
                  <p class="text-sm font-bold text-sf-text">{{ emp.hireDate | date:'longDate' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sales Activity Section -->
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-xl">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-display font-black text-sf-text">سجل المبيعات</h3>
              <span class="px-4 py-1.5 rounded-full bg-sf-primary/10 text-sf-primary text-xs font-black">{{ sales().length }} مبيعة</span>
            </div>

            <div class="space-y-4">
              @for (sale of sales(); track sale._id) {
                <div class="group p-5 rounded-2xl bg-sf-surface border border-sf-border hover:border-sf-primary/40 transition-all hover:shadow-lg">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-white border border-sf-border flex items-center justify-center text-sf-primary text-lg shadow-sm">
                        <ng-icon name="heroBuildingOffice"></ng-icon>
                      </div>
                      <div>
                        <div class="flex items-center gap-2 mb-0.5">
                          <p class="text-sm font-black text-sf-text">{{ sale.projectName }}</p>
                          <span class="text-[10px] font-bold text-sf-muted px-2 py-0.5 rounded-full bg-sf-surface border border-sf-border">الوحدة: {{ sale.unitNumber }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-[10px] font-bold text-sf-muted">
                          <span class="flex items-center gap-1"><ng-icon name="heroUsers"></ng-icon> {{ sale.clientName }}</span>
                          <span class="opacity-30">•</span>
                          <span class="flex items-center gap-1"><ng-icon name="heroCalendar"></ng-icon> {{ sale.contractDate | date:'shortDate' }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between md:justify-end gap-6 md:min-w-[150px]">
                      <div class="text-left md:text-right">
                        <p class="text-[10px] font-black text-sf-muted uppercase tracking-tighter mb-0.5">قيمة الوحدة</p>
                        <p class="text-sm font-black text-sf-primary">{{ sale.unitValue | currencyEgp }}</p>
                      </div>
                      <span class="badge h-8 px-4" 
                            [class.badge-success]="sale.status === 'collected' || sale.status === 'confirmed'"
                            [class.badge-warning]="sale.status === 'claimed'"
                            [class.badge-secondary]="sale.status === 'draft'">
                        {{ sale.status === 'confirmed' ? 'مؤكد' : 
                           sale.status === 'collected' ? 'مُحصل' : 
                           sale.status === 'claimed' ? 'قيد المطالبة' : 'مسودة' }}
                      </span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="text-center py-12 bg-sf-surface/50 rounded-3xl border border-dashed border-sf-border">
                  <p class="text-sf-muted font-bold">لا توجد مبيعات مسجلة لهذا الموظف حتى الآن</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Sidebar: Career History -->
        <div class="lg:col-span-1 space-y-8">
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-xl sticky top-24">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-display font-black text-sf-text">السجل الوظيفي</h3>
              <button [routerLink]="['history/edit']" class="w-10 h-10 rounded-xl bg-sf-primary/5 text-sf-primary flex items-center justify-center hover:bg-sf-primary hover:text-white transition-all shadow-sm">
                <ng-icon name="heroPencil"></ng-icon>
              </button>
            </div>

            <div class="space-y-6 relative before:absolute before:right-3.5 before:top-3 before:bottom-3 before:w-px before:bg-sf-border/60">
              <div *ngFor="let item of history(); let last = last" class="relative pr-10 group">
                <!-- Timeline Dot -->
                <div class="absolute right-0 top-1.5 w-7 h-7 rounded-full bg-sf-bg border-2 z-10 flex items-center justify-center transition-all group-hover:scale-110"
                     [class.border-sf-primary]="item.type === 'team'"
                     [class.border-sf-muted]="item.type === 'no-team'">
                  <div class="w-2.5 h-2.5 rounded-full"
                       [class.bg-sf-primary]="item.type === 'team'"
                       [class.bg-sf-muted]="item.type === 'no-team'"></div>
                </div>

                <div class="p-5 rounded-2xl bg-sf-surface border border-sf-border/40 group-hover:border-sf-primary/20 transition-all group-hover:bg-sf-primary/[0.02]">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] font-black uppercase tracking-wider"
                          [class.text-sf-primary]="item.type === 'team'"
                          [class.text-sf-muted]="item.type === 'no-team'">
                      {{ item.type === 'team' ? 'فريق' : 'فترة مستقلة' }}
                    </span>
                    <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-sf-bg border border-sf-border">
                      {{ item.durationDays }} يوم
                    </span>
                  </div>
                  
                  <h4 class="font-bold text-sf-text mb-2">{{ item.name }}</h4>
                  
                  <div class="flex items-center gap-2 text-[10px] font-bold text-sf-muted">
                    <ng-icon name="heroClock"></ng-icon>
                    <span>{{ item.startDate | date:'shortDate' }}</span>
                    <span>→</span>
                    <span>{{ item.endDate ? (item.endDate | date:'shortDate') : 'الآن' }}</span>
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
    .badge-error { 
      background-color: rgba(var(--sf-danger-rgb), 0.1); 
      color: var(--sf-danger); 
    }
    .badge-warning { 
      background-color: rgba(var(--sf-accent-rgb), 0.1); 
      color: var(--sf-accent); 
    }
    .badge-secondary { 
      background-color: rgba(var(--sf-muted-rgb), 0.1); 
      color: var(--sf-muted); 
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private saleService = inject(SaleService);
  private themeService = inject(ThemeService);

  employee = signal<Employee | null>(null);
  stats = signal<any>(null);
  history = signal<any[]>([]);
  sales = signal<any[]>([]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadEmployee(params['id']);
        this.loadHistory(params['id']);
        this.loadSales(params['id']);
      }
    });
  }

  loadEmployee(id: string) {
    this.employeeService.getEmployee(id).subscribe({
      next: (res: ApiResponse<Employee>) => {
        this.employee.set(res.data);
        this.loadStats(id);
      }
    });
  }

  loadStats(id: string) {
    const quarterId = 'Q2-2026'; // Should be dynamic
    this.employeeService.getTargetProgress(id, quarterId).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.stats.set(res.data);
      }
    });
  }

  loadHistory(id: string) {
    this.employeeService.getTeamHistory(id).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.history.set(res.data.timeline);
      }
    });
  }

  loadSales(id: string) {
    this.saleService.getSales({ employeeId: id, limit: 100 }).subscribe({
      next: (res) => {
        if (res.success) this.sales.set(res.data);
      }
    });
  }

  goBack() {
    this.router.navigate(['/employees']);
  }

  deleteEmployee() {
    const emp = this.employee();
    if (!emp) return;

    if (confirm(`هل أنت متأكد من حذف الموظف "${emp.name}"؟`)) {
      this.themeService.loading.set(true);
      this.employeeService.deleteEmployee(emp._id).subscribe({
        next: () => {
          this.themeService.loading.set(false);
          this.router.navigate(['/employees']);
        },
        error: () => this.themeService.loading.set(false)
      });
    }
  }

  toggleActivation() {
    const emp = this.employee();
    if (!emp) return;

    const actionText = emp.isActive ? 'تعطيل' : 'تفعيل';
    if (confirm(`هل أنت متأكد من ${actionText} حساب الموظف "${emp.name}"؟`)) {
      this.themeService.loading.set(true);
      this.employeeService.updateEmployee(emp._id, { isActive: !emp.isActive }).subscribe({
        next: (res) => {
          this.themeService.loading.set(false);
          if (res.success) {
            this.employee.set(res.data);
            this.employeeService.invalidateCache();
          }
        },
        error: () => this.themeService.loading.set(false)
      });
    }
  }
}
