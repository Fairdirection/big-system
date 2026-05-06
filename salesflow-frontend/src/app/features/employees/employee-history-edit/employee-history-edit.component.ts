import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '@core/services/employee.service';
import { ThemeService } from '@core/services/theme.service';
import { Employee } from '@core/models/employee.model';
import { ApiResponse } from '@core/models/api-response.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  heroChevronRight, 
  heroPencil, 
  heroTrash, 
  heroPlus, 
  heroCheck, 
  heroXMark,
  heroClock,
  heroBriefcase,
  heroCalendarDays,
  heroArrowRight
} from '@ng-icons/heroicons/outline';
import { TeamService } from '@core/services/team.service';

@Component({
  selector: 'app-employee-history-edit',
  standalone: true,
  imports: [CommonModule, NgIconComponent, FormsModule],
  providers: [
    provideIcons({ 
      heroChevronRight, 
      heroPencil, 
      heroTrash, 
      heroPlus, 
      heroCheck, 
      heroXMark,
      heroClock,
      heroBriefcase,
      heroCalendarDays,
      heroArrowRight
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center gap-6">
          <button (click)="goBack()" class="btn-icon p-2 bg-sf-surface border border-sf-border rounded-2xl shadow-sm">
            <ng-icon name="heroArrowRight" class="text-xl"></ng-icon>
          </button>
          <div>
            <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">إدارة السجل الوظيفي</h1>
            <p class="text-sf-muted font-bold mt-1 flex items-center gap-2">
              <span class="text-sf-primary">{{ employee()?.name }}</span>
              <span class="opacity-30">•</span>
              <span>كود: {{ employee()?.code }}</span>
            </p>
          </div>
        </div>

        <!-- Quick Stats Header -->
        <div class="flex items-center gap-4">
          <div class="glass-card px-5 py-3 rounded-2xl border-sf-primary/20 bg-sf-primary/5">
            <p class="text-[9px] font-black text-sf-primary uppercase tracking-widest mb-0.5">إجمالي الأقدمية</p>
            <p class="text-lg font-black text-sf-text">{{ summaryStats()?.totalSeniorityDays }} <span class="text-[10px] text-sf-muted font-bold">يوم</span></p>
          </div>
          <div class="glass-card px-5 py-3 rounded-2xl border-sf-success/20 bg-sf-success/5">
            <p class="text-[9px] font-black text-sf-success uppercase tracking-widest mb-0.5">أيام الربع الحالي</p>
            <p class="text-lg font-black text-sf-text">{{ summaryStats()?.quarterWorkingDays }} <span class="text-[10px] text-sf-muted font-bold">يوم</span></p>
          </div>
        </div>
      </header>

      <!-- Warning/Info -->
      <div class="glass-card p-6 rounded-3xl border-sf-info/20 bg-sf-info/5 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-2xl bg-sf-info/10 flex items-center justify-center text-sf-info shrink-0">
          <ng-icon name="heroClock"></ng-icon>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-black text-sf-info uppercase tracking-wider">تنبيه ذكي</p>
          <p class="text-xs font-bold text-sf-muted leading-relaxed">
            يتم حساب "أيام العمل" و "الأقدمية" بناءً على هذا السجل. يمكنك إضافة فترات "بدون فريق" يدوياً أو ترك فجوات ليقوم النظام بحسابها تلقائياً.
          </p>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar: Current Timeline Summary -->
        <div class="lg:col-span-1 space-y-6">
          <div class="glass-card p-6 rounded-3xl sticky top-24 shadow-xl">
            <h3 class="text-xs font-black text-sf-muted uppercase tracking-[0.2em] mb-6">الخط الزمني المباشر</h3>
            <div class="space-y-4 relative before:absolute before:right-2 before:top-2 before:bottom-2 before:w-px before:bg-sf-border/40">
              @for (item of history(); track item.startDate) {
                <div class="pr-6 relative group">
                  <div class="absolute right-0 top-1.5 w-4 h-4 rounded-full border-2 border-sf-bg z-10 transition-all group-hover:scale-125"
                       [class.bg-sf-primary]="item.type === 'team'"
                       [class.bg-sf-muted]="item.type === 'no-team'"></div>
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-xs font-black text-sf-text">{{ item.name }}</p>
                      <p class="text-[9px] font-bold text-sf-muted">{{ item.startDate | date:'mediumDate' }}</p>
                    </div>
                    <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sf-surface border border-sf-border">{{ item.durationDays }} يوم</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Team Statistics -->
          <div class="glass-card p-6 rounded-3xl shadow-xl mt-6">
            <h3 class="text-xs font-black text-sf-muted uppercase tracking-[0.2em] mb-6">إجمالي الوقت مع الفرق</h3>
            <div class="space-y-4">
              @for (stat of summaryStats()?.teamStats; track stat.name) {
                <div class="flex items-center justify-between p-3 bg-sf-surface rounded-2xl border border-sf-border">
                  <div class="flex items-center gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-sf-primary"></div>
                    <span class="text-xs font-bold text-sf-text">{{ stat.name }}</span>
                  </div>
                  <span class="text-[10px] font-black text-sf-primary">{{ stat.days }} يوم</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Main Area: Management Cards -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Add New Record Section -->
          <div class="glass-card p-8 rounded-3xl border-dashed border-2 border-sf-primary/30 bg-sf-primary/5 transition-all">
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="w-16 h-16 rounded-2xl bg-sf-primary/20 flex items-center justify-center text-sf-primary">
                <ng-icon name="heroPlus" class="text-2xl"></ng-icon>
              </div>
              <div class="flex-1 space-y-4">
                <h3 class="text-xl font-display font-black text-sf-text">إضافة سجل جديد للسيرة الذاتية</h3>
                <div class="flex flex-wrap gap-3">
                   <button (click)="isAddingNew.set(true); newRecordType.set('team')" class="btn btn-primary h-10 px-6 text-xs">إضافة انتماء لفريق</button>
                   <button (click)="isAddingNew.set(true); newRecordType.set('no-team')" class="btn btn-secondary h-10 px-6 text-xs">إضافة فترة عمل حر/بدون فريق</button>
                </div>
              </div>
            </div>

            <!-- Inline Add Form -->
            @if (isAddingNew()) {
              <div class="mt-8 pt-8 border-t border-sf-border animate-fade-in space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  @if (newRecordType() === 'team') {
                    <div>
                      <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest mb-2">اختر الفريق</label>
                      <select [(ngModel)]="newRecordData.teamId"
                              class="w-full bg-sf-bg border border-sf-border rounded-xl px-4 py-3 text-xs font-bold text-sf-text outline-none focus:border-sf-primary transition-all">
                        <option [value]="null">اختر فريقاً...</option>
                        @for (team of teams(); track team._id) {
                          <option [value]="team._id">{{ team.name }}</option>
                        }
                      </select>
                    </div>
                  } @else {
                    <div>
                      <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest mb-2">وصف الفترة</label>
                      <input type="text" value="بدون فريق (يدوي)" disabled
                             class="w-full bg-sf-surface border border-sf-border rounded-xl px-4 py-3 text-xs font-bold text-sf-muted outline-none">
                    </div>
                  }
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest mb-2">من تاريخ</label>
                      <input type="date" [(ngModel)]="newRecordData.startDate"
                             class="w-full bg-sf-bg border border-sf-border rounded-xl px-4 py-3 text-xs font-bold text-sf-text outline-none focus:border-sf-primary transition-all">
                    </div>
                    <div>
                      <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest mb-2">إلى تاريخ</label>
                      <input type="date" [(ngModel)]="newRecordData.endDate"
                             class="w-full bg-sf-bg border border-sf-border rounded-xl px-4 py-3 text-xs font-bold text-sf-text outline-none focus:border-sf-primary transition-all">
                    </div>
                  </div>
                </div>
                <div class="flex justify-end gap-3">
                  <button (click)="isAddingNew.set(false)" class="px-6 py-2 text-xs font-bold text-sf-muted hover:text-sf-text transition-colors">إلغاء</button>
                  <button (click)="submitNewRecord()" class="btn btn-primary h-11 px-8 text-xs shadow-glow-sm">تأكيد الإضافة</button>
                </div>
              </div>
            }
          </div>

          <!-- List of Editable Records -->
          <div class="space-y-4">
            @for (record of history(); track record.historyId || record.startDate) {
              <div class="glass-card p-6 rounded-3xl border border-sf-border group hover:border-sf-primary/40 transition-all duration-500 relative">
                <!-- Days Badge -->
                <div class="flex flex-wrap gap-4 items-center mb-6">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sf-surface border border-sf-border">
                        <ng-icon name="heroClock" class="text-sf-primary"></ng-icon>
                        <span class="text-[10px] font-bold text-sf-muted">{{ record.durationDays }} يوم</span>
                    </div>
                    @if (record.achievement) {
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sf-success/5 border border-sf-success/20">
                        <ng-icon name="heroTrophy" class="text-sf-success"></ng-icon>
                        <span class="text-[10px] font-black text-sf-success">{{ record.achievement | number }} ج.م</span>
                        </div>
                    }
                </div>

                <div class="flex flex-col sm:flex-row gap-6">
                  <!-- Icon & Status -->
                  <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                       [class.bg-sf-primary/10]="record.type === 'team'"
                       [class.text-sf-primary]="record.type === 'team'"
                       [class.bg-sf-muted/10]="record.type === 'no-team'"
                       [class.text-sf-muted]="record.type === 'no-team'">
                    <ng-icon [name]="record.type === 'team' ? 'heroBriefcase' : 'heroCalendarDays'" class="text-2xl"></ng-icon>
                  </div>

                  <!-- Details Form -->
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div class="space-y-4">
                      <div>
                        <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest mb-2">الجهة / الفريق</label>
                        @if (record.type === 'team') {
                          <select [(ngModel)]="record.teamId" (change)="markAsDirty(record)"
                                  class="w-full bg-sf-bg border border-sf-border rounded-xl px-4 py-2.5 text-xs font-bold text-sf-text outline-none focus:border-sf-primary transition-all">
                            @for (team of teams(); track team._id) {
                              <option [value]="team._id">{{ team.name }}</option>
                            }
                          </select>
                        } @else {
                          <div class="w-full bg-sf-surface border border-sf-border rounded-xl px-4 py-2.5 text-xs font-bold text-sf-muted">
                            {{ record.name }}
                          </div>
                        }
                      </div>
                      <div>
                        <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest mb-2">تاريخ الانضمام</label>
                        @if (record.historyId) {
                          <input type="date" [ngModel]="formatDate(record.startDate)" (ngModelChange)="updateDate(record, 'startDate', $event)"
                                 class="w-full bg-sf-bg border border-sf-border rounded-xl px-4 py-2.5 text-xs font-bold text-sf-text outline-none focus:border-sf-primary transition-all">
                        } @else {
                          <div class="w-full bg-sf-surface border border-sf-border rounded-xl px-4 py-2.5 text-xs font-bold text-sf-muted">
                            {{ record.startDate | date:'mediumDate' }}
                          </div>
                        }
                      </div>
                    </div>

                    <div class="space-y-4">
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-[10px] font-black text-sf-muted uppercase tracking-widest">تاريخ المغادرة</label>
                        @if (record.historyId) {
                          <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" [checked]="!record.endDate" (change)="toggleCurrent(record)" class="w-3.5 h-3.5 rounded border-sf-border text-sf-primary">
                            <span class="text-[10px] font-bold text-sf-muted">حالي</span>
                          </label>
                        }
                      </div>
                      
                      @if (record.historyId) {
                        <input type="date" [disabled]="!record.endDate" [ngModel]="formatDate(record.endDate)" (ngModelChange)="updateDate(record, 'endDate', $event)"
                               class="w-full bg-sf-bg border border-sf-border rounded-xl px-4 py-2.5 text-xs font-bold text-sf-text outline-none focus:border-sf-primary transition-all disabled:opacity-30">
                      } @else {
                         <div class="w-full bg-sf-surface border border-sf-border rounded-xl px-4 py-2.5 text-xs font-bold text-sf-muted">
                            {{ record.endDate ? (record.endDate | date:'mediumDate') : 'الآن' }}
                          </div>
                      }
                      
                      <div class="flex items-center justify-end gap-3 pt-2">
                        @if (record.historyId) {
                          <button *ngIf="record.isDirty" (click)="saveRecord(record)" 
                                  class="btn btn-primary h-10 px-4 text-xs">
                            <ng-icon name="heroCheck"></ng-icon>
                            <span>حفظ</span>
                          </button>
                          <button (click)="deleteRecord(record)" class="btn-icon p-2 text-sf-error/60 hover:text-sf-error hover:bg-sf-error/5 rounded-xl">
                            <ng-icon name="heroTrash"></ng-icon>
                          </button>
                        } @else if (record.isInitial) {
                           <button (click)="editHireDate(record)" class="btn btn-secondary h-10 px-4 text-xs">
                            <ng-icon name="heroPencil"></ng-icon>
                            <span>تعديل التعيين</span>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding-top: 2rem; }
    .btn-icon { @apply transition-all duration-300 active:scale-90 cursor-pointer; }
  `]
})
export class EmployeeHistoryEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private teamService = inject(TeamService);
  private themeService = inject(ThemeService);

  employee = signal<Employee | null>(null);
  history = signal<any[]>([]);
  teams = signal<any[]>([]);
  summaryStats = signal<any>(null);

  // Add Record State
  isAddingNew = signal(false);
  newRecordType = signal<'team' | 'no-team'>('team');
  newRecordData = {
    teamId: null as string | null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null as string | null
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.employeeService.getEmployee(id).subscribe(res => {
      this.employee.set(res.data);
      this.loadHistory();
    });

    this.teamService.getTeams().subscribe(res => {
      this.teams.set(res.data);
    });
  }

  loadHistory() {
    const id = this.employee()?._id;
    if (!id) return;
    this.employeeService.getTeamHistory(id).subscribe(res => {
      if (res.success) {
        this.history.set(res.data.timeline.map((item: any) => ({ ...item, isDirty: false })));
        this.summaryStats.set(res.data.stats);
      }
    });
  }

  goBack() {
    this.router.navigate(['/employees', this.employee()?._id]);
  }

  formatDate(date: any) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  updateDate(record: any, field: string, value: string) {
    if (field === 'startDate') record.startDate = value;
    if (field === 'endDate') record.endDate = value;
    record.isDirty = true;
  }

  markAsDirty(record: any) {
    record.isDirty = true;
  }

  toggleCurrent(record: any) {
    if (record.endDate) {
      record.endDate = null;
    } else {
      record.endDate = new Date().toISOString().split('T')[0];
    }
    record.isDirty = true;
  }

  saveRecord(record: any) {
    if (!record.historyId) return;
    
    this.themeService.loading.set(true);
    const data = {
      teamId: record.teamId,
      joinDate: record.startDate,
      leaveDate: record.endDate
    };

    this.employeeService.updateHistory(record.historyId, data).subscribe({
      next: () => {
        this.themeService.loading.set(false);
        this.loadHistory();
      },
      error: () => this.themeService.loading.set(false)
    });
  }

  submitNewRecord() {
    const id = this.employee()?._id;
    if (!id) return;

    if (this.newRecordType() === 'team' && !this.newRecordData.teamId) {
      alert('الرجاء اختيار فريق');
      return;
    }

    this.themeService.loading.set(true);
    const payload = {
      teamId: this.newRecordType() === 'team' ? this.newRecordData.teamId : null,
      joinDate: this.newRecordData.startDate,
      leaveDate: this.newRecordData.endDate
    };

    this.employeeService.addHistory(id, payload).subscribe({
      next: () => {
        this.themeService.loading.set(false);
        this.isAddingNew.set(false);
        this.loadHistory();
      },
      error: () => this.themeService.loading.set(false)
    });
  }

  deleteRecord(record: any) {
    if (!record.historyId || !confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    this.themeService.loading.set(true);
    this.employeeService.deleteHistory(record.historyId).subscribe({
      next: () => {
        this.themeService.loading.set(false);
        this.loadHistory();
      },
      error: () => this.themeService.loading.set(false)
    });
  }

  editHireDate(record: any) {
    const newDate = prompt('أدخل تاريخ التعيين الجديد (YYYY-MM-DD):', this.formatDate(record.startDate));
    if (newDate) {
      this.themeService.loading.set(true);
      this.employeeService.updateEmployee(this.employee()?._id || '', { hireDate: newDate }).subscribe({
        next: () => {
          this.themeService.loading.set(false);
          this.loadHistory();
        },
        error: () => this.themeService.loading.set(false)
      });
    }
  }
}
