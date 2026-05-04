import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '@core/services/employee.service';
import { ThemeService } from '@core/services/theme.service';
import { Employee } from '@core/models/employee.model';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroPlus, heroMagnifyingGlass, heroIdentification, heroEnvelope, heroPhone, heroChevronRight } from '@ng-icons/heroicons/outline';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, CurrencyEgpPipe, NgIconComponent, RouterLink],
  providers: [
    provideIcons({ heroPlus, heroMagnifyingGlass, heroIdentification, heroEnvelope, heroPhone, heroChevronRight })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-sf-text tracking-tight">المؤسسة</h1>
          <p class="text-sf-muted font-medium mt-1">إدارة أعضاء الفريق، الأقسام، ومستهدفات المبيعات.</p>
        </div>
        <button [routerLink]="['new']" class="btn btn-primary flex items-center gap-2">
          <ng-icon name="heroPlus"></ng-icon>
          <span>إضافة موظف</span>
        </button>
      </header>

      <!-- Stats / Filter Bar -->
      <div class="flex flex-col md:flex-row items-center gap-4 bg-sf-surface/50 p-4 rounded-2xl border border-sf-border shadow-xl">
        <div class="relative flex-1 w-full group">
          <ng-icon name="heroMagnifyingGlass" class="absolute right-4 top-1/2 -translate-y-1/2 text-sf-muted group-focus-within:text-sf-primary transition-colors"></ng-icon>
          <input type="text" placeholder="بحث بالاسم، الكود أو البريد..." 
                 (input)="onSearch($event)"
                 class="w-full pr-11 pl-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm focus:ring-2 focus:ring-sf-primary/50 transition-all outline-none">
          <p class="absolute -bottom-5 right-2 text-[10px] text-sf-muted opacity-0 group-focus-within:opacity-100 transition-opacity">ابحث بالاسم أو الكود الوظيفي للوصول السريع.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm font-semibold text-sf-text">
            <span class="text-sf-muted ml-2">الإجمالي:</span>
            {{ filteredEmployees().length }}
          </div>
        </div>
      </div>

      <!-- Employee Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" *ngIf="!loading(); else skeleton">
        @for (emp of filteredEmployees(); track emp._id) {
          <div class="glass-card p-6 rounded-2xl border border-sf-border shadow-xl hover:border-sf-primary/50 transition-all group cursor-pointer"
               [routerLink]="[emp._id]">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center text-white text-xl font-display font-black shadow-glow-sm">
                  {{ emp.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="text-base font-bold text-sf-text group-hover:text-sf-primary transition-colors line-clamp-1">{{ emp.name }}</h3>
                  <span class="text-xs font-bold text-sf-muted uppercase tracking-widest">{{ emp.code }}</span>
                </div>
              </div>
              <app-badge [color]="emp.isActive ? 'success' : 'gray'">{{ emp.isActive ? 'نشط' : 'غير نشط' }}</app-badge>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3 text-sm text-sf-muted">
                <ng-icon name="heroIdentification" class="text-sf-primary"></ng-icon>
                <span class="font-medium">{{ translateDepartment(emp.department) }} • {{ translateSeniority(emp.seniorityLevel) }}</span>
              </div>
              
              <div class="grid grid-cols-2 gap-4 py-4 border-y border-sf-border/30">
                <div class="flex flex-col">
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">المستهدف الحالي</span>
                  <span class="text-sm font-black text-sf-text">{{ emp.target | currencyEgp }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] font-bold text-sf-muted uppercase tracking-tighter">تاريخ التعيين</span>
                  <span class="text-sm font-semibold text-sf-text">{{ emp.hireDate | date:'mediumDate' }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-2">
                  <button class="p-2 bg-sf-bg border border-sf-border rounded-lg text-sf-muted hover:text-sf-primary transition-colors"
                          [title]="emp.email">
                    <ng-icon name="heroEnvelope"></ng-icon>
                  </button>
                  <button class="p-2 bg-sf-bg border border-sf-border rounded-lg text-sf-muted hover:text-sf-primary transition-colors"
                          [title]="emp.phone">
                    <ng-icon name="heroPhone"></ng-icon>
                  </button>
                </div>
                <button class="flex items-center gap-1 text-xs font-black text-sf-primary uppercase tracking-widest group-hover:gap-2 transition-all">
                  الملف الشخصي
                  <ng-icon name="heroChevronRight" class="rotate-180"></ng-icon>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full py-32 flex flex-col items-center justify-center text-sf-muted text-center">
            <div class="w-20 h-20 rounded-full bg-sf-surface flex items-center justify-center mb-6 border border-sf-border border-dashed animate-pulse">
              <ng-icon name="heroIdentification" class="text-4xl opacity-20"></ng-icon>
            </div>
            <h3 class="text-xl font-bold">لم يتم العثور على موظفين</h3>
            <p class="text-sm">تأكد من كتابة الاسم بشكل صحيح أو ابدأ بإضافة موظفين جدد.</p>
          </div>
        }
      </div>

      <ng-template #skeleton>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div class="h-64 bg-sf-surface rounded-2xl border border-sf-border skeleton" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .shadow-glow-sm {
      box-shadow: 0 0 15px rgba(147, 51, 234, 0.2);
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private themeService = inject(ThemeService);
  employees = signal<Employee[]>([]);
  searchTerm = signal('');
  loading = signal(true);

  filteredEmployees = signal<Employee[]>([]);

  constructor() {
    effect(() => {
      // Trigger effect on quarter change
      this.themeService.currentQuarter();
      this.loadEmployees();
    });
  }

  ngOnInit() {}

  loadEmployees() {
    this.themeService.loading.set(true);
    this.loading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: res => {
        this.themeService.loading.set(false);
        this.loading.set(false);
        if (res.success) {
          this.employees.set(res.data);
          this.filteredEmployees.set(res.data);
        }
      },
      error: () => {
        this.themeService.loading.set(false);
        this.loading.set(false);
      }
    });
  }

  onSearch(event: any) {
    const term = event.target.value.toLowerCase();
    this.searchTerm.set(term);
    this.filteredEmployees.set(
      this.employees().filter(e => 
        e.name.toLowerCase().includes(term) || 
        e.code.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term)
      )
    );
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

  translateSeniority(level: string | undefined): string {
    if (!level) return 'غير محدد';
    const map: any = {
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
