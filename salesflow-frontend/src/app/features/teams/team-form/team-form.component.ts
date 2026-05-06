import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService } from '@core/services/team.service';
import { EmployeeService } from '@core/services/employee.service';
import { Employee } from '@core/models/employee.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroArrowRight, heroCheck, heroUserGroup, heroIdentification, heroUserPlus } from '@ng-icons/heroicons/outline';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent],
  providers: [
    provideIcons({ heroArrowRight, heroCheck, heroUserGroup, heroIdentification, heroUserPlus })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button routerLink="/teams" class="p-3 rounded-2xl bg-sf-surface border border-sf-border text-sf-muted hover:text-sf-primary transition-all">
            <ng-icon name="heroArrowRight"></ng-icon>
          </button>
          <div>
            <h1 class="text-3xl font-black text-sf-text tracking-tight mb-2">
              {{ isEdit() ? 'تعديل فريق' : 'إنشاء فريق جديد' }}
            </h1>
            <div class="flex items-center gap-3">
              <p class="text-sf-muted text-sm font-medium">تحديد قائد الفريق والأعضاء المنضمين للمجموعة.</p>
              <span class="px-2 py-0.5 rounded-full bg-sf-primary/10 border border-sf-primary/20 text-[10px] font-bold text-sf-primary">
                {{ totalEmployeesFound() }} موظف في النظام
              </span>
            </div>
          </div>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Main Form -->
        <div class="md:col-span-2 space-y-6">
          <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-8">
            
            <!-- Team Leader -->
            <div class="space-y-4">
              <label class="flex items-center gap-2 text-sm font-black text-sf-text uppercase tracking-widest">
                <ng-icon name="heroIdentification" class="text-sf-primary"></ng-icon>
                قائد الفريق
              </label>
              <select formControlName="teamLeaderId"
                      class="w-full px-5 py-4 bg-sf-bg border border-sf-border rounded-2xl text-sf-text focus:ring-4 focus:ring-sf-primary/20 transition-all outline-none appearance-none">
                <option value="">اختر قائد الفريق...</option>
                @for (emp of leaders(); track emp._id) {
                  <option [value]="emp._id">{{ emp.name }} ({{ emp.code }})</option>
                }
              </select>
              <p class="text-[10px] text-sf-muted font-bold">سيتم استخدام اسم القائد كاسم تلقائي للفريق.</p>
            </div>

            <!-- Members Selection -->
            <div class="space-y-4">
              <label class="flex items-center gap-2 text-sm font-black text-sf-text uppercase tracking-widest">
                <ng-icon name="heroUserPlus" class="text-sf-primary"></ng-icon>
                أعضاء الفريق
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                @for (emp of memberCandidates(); track emp._id) {
                  @let perf = getMemberPerf(emp._id);
                  <div (click)="toggleMember(emp._id)"
                       class="p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group"
                       [class.bg-sf-primary/10]="isMemberSelected(emp._id)"
                       [class.border-sf-primary/50]="isMemberSelected(emp._id)"
                       [class.border-sf-border]="!isMemberSelected(emp._id)"
                       [class.bg-sf-surface]="!isMemberSelected(emp._id)">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-sf-bg border border-sf-border flex items-center justify-center text-[10px] font-black text-sf-muted group-hover:text-sf-primary transition-colors">
                        {{ emp.name.charAt(0) }}
                      </div>
                      <div>
                        <span class="text-xs font-bold text-sf-text block">{{ emp.name }}</span>
                        @if (perf) {
                          <div class="flex items-center gap-2 mt-1">
                            <span class="text-[9px] font-black text-sf-success">{{ perf.achieved | number }} ج.م</span>
                            <span class="text-[8px] px-1.5 py-0.5 rounded-md bg-sf-success/10 text-sf-success border border-sf-success/20">
                              {{ perf.achievementPercentage | number:'1.0-1' }}%
                            </span>
                          </div>
                        } @else if (emp.currentTeamId) {
                          <span class="text-[9px] px-1.5 py-0.5 rounded-md bg-sf-warning/10 text-sf-warning border border-sf-warning/20">منضم لفريق</span>
                        }
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                         [class.bg-sf-primary]="isMemberSelected(emp._id)"
                         [class.border-sf-primary]="isMemberSelected(emp._id)"
                         [class.border-sf-border]="!isMemberSelected(emp._id)">
                      <ng-icon *ngIf="isMemberSelected(emp._id)" name="heroCheck" class="text-white text-xs"></ng-icon>
                    </div>
                  </div>
                } @empty {
                  <div class="col-span-full py-8 text-center border-2 border-dashed border-sf-border rounded-2xl bg-sf-surface/20">
                    <p class="text-xs font-bold text-sf-muted uppercase tracking-widest">لا يوجد أعضاء متاحين (Sales Dept)</p>
                    <p class="text-[10px] text-sf-muted mt-1 px-4">تأكد من وجود موظفين برتبة (Fresh/BA/BC) غير منضمين لفرق أخرى.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="space-y-6">
          <div class="glass-card p-6 rounded-3xl border border-sf-border shadow-xl space-y-6">
            <div class="text-center space-y-2">
              <div class="w-16 h-16 rounded-2xl bg-sf-primary/10 text-sf-primary flex items-center justify-center mx-auto">
                <ng-icon name="heroUserGroup" class="text-3xl"></ng-icon>
              </div>
              <h3 class="font-bold text-sf-text">ملخص الفريق</h3>
              <p class="text-xs text-sf-muted">يوجد حالياً {{ form.get('memberIds')?.value?.length || 0 }} أعضاء مختارين.</p>
            </div>

            @if (performance(); as perf) {
              <div class="p-5 rounded-2xl bg-sf-primary/5 border border-sf-primary/10 space-y-4">
                <div class="flex items-center justify-between">
                  <p class="text-[10px] font-black text-sf-muted uppercase tracking-wider">إجمالي الإنجاز</p>
                  <span class="px-2 py-0.5 rounded-full bg-sf-primary/10 text-[10px] font-black text-sf-primary">{{ perf.overallAchievementPercentage | number:'1.0-1' }}%</span>
                </div>
                <h4 class="text-xl font-display font-black text-sf-primary">{{ perf.totalAchieved | number }} <span class="text-[10px] opacity-70">ج.م</span></h4>
                <div class="w-full h-1.5 bg-sf-border rounded-full overflow-hidden">
                  <div class="h-full bg-sf-primary transition-all duration-1000" [style.width.%]="perf.overallAchievementPercentage"></div>
                </div>
              </div>
            }

            <div class="space-y-3 pt-4 border-t border-sf-border/50">
              <button type="submit" 
                      [disabled]="form.invalid || loading()"
                      class="w-full btn btn-primary py-4 flex items-center justify-center gap-2 shadow-glow-sm">
                <ng-icon *ngIf="!loading()" name="heroCheck"></ng-icon>
                <span>{{ isEdit() ? 'حفظ التعديلات' : 'تأكيد الإنشاء' }}</span>
              </button>
              <button type="button" routerLink="/teams"
                      class="w-full py-4 text-xs font-black text-sf-muted uppercase tracking-widest hover:text-sf-text transition-colors">
                إلغاء العملية
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .shadow-glow-sm { box-shadow: 0 0 15px rgba(147, 51, 234, 0.3); }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(147, 51, 234, 0.2); border-radius: 10px; }
  `]
})
export class TeamFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  loading = signal(false);
  isEdit = signal(false);
  teamId = signal<string | null>(null);
  employees = signal<Employee[]>([]);
  performance = signal<any>(null);
  
  selectedLeaderId = signal<string>('');
  
  // Both TeamLeader and SalesManager ranks can lead teams
  leaders = computed(() => {
    const currentId = this.teamId();
    return this.employees().filter(e => {
      const isEligibleLeader = e.seniorityLevel === 'TeamLeader' || e.seniorityLevel === 'SalesManager';
      // If we are editing, allow the current leader of THIS team
      // Otherwise, only allow leaders who are NOT already in a team
      const isAvailable = !e.currentTeamId || (currentId && (e.currentTeamId === currentId || e.currentTeamId._id === currentId));
      return isEligibleLeader && isAvailable;
    });
  });

  // Dynamically calculated candidates based on selected leader seniority level
  memberCandidates = computed(() => {
    const leaderId = this.selectedLeaderId();
    const leaderObj = this.employees().find(e => e._id === leaderId);
    
    if (leaderObj && leaderObj.seniorityLevel === 'SalesManager') {
      // If the selected leader is a SalesManager, only TeamLeaders can be member candidates
      return this.employees().filter(e => e.seniorityLevel === 'TeamLeader');
    } else {
      // If the selected leader is a TeamLeader (or anyone else), member candidates are standard members
      // i.e., NOT TeamLeader and NOT SalesManager
      return this.employees().filter(e => e.seniorityLevel !== 'TeamLeader' && e.seniorityLevel !== 'SalesManager');
    }
  });

  constructor() {
    this.form = this.fb.group({
      teamLeaderId: ['', Validators.required],
      memberIds: [[]]
    });

    // Listen to value changes of teamLeaderId to update the signal and reset incompatible members
    this.form.get('teamLeaderId')?.valueChanges.subscribe(val => {
      const oldLeaderId = this.selectedLeaderId();
      this.selectedLeaderId.set(val || '');

      // Reset member selection if leader type changes to prevent invalid member types
      const oldLeaderObj = this.employees().find(e => e._id === oldLeaderId);
      const newLeaderObj = this.employees().find(e => e._id === val);
      const oldLevel = oldLeaderObj?.seniorityLevel;
      const newLevel = newLeaderObj?.seniorityLevel;

      if (oldLeaderId && oldLevel !== newLevel) {
        this.form.patchValue({ memberIds: [] }, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    this.loadEmployees();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.teamId.set(id);
      this.loadTeam(id);
      this.loadPerformance(id);
    }
  }

  loadPerformance(id: string) {
    const quarterId = 'Q2-2026'; // Should be dynamic
    this.teamService.getTargetSummary(id, quarterId).subscribe({
      next: (res) => {
        if (res.success) this.performance.set(res.data);
      }
    });
  }

  totalEmployeesFound = signal(0);

  loadEmployees() {
    const id = this.route.snapshot.params['id'];
    
    // Fetch all active employees (we will filter availability in the computed signals)
    this.employeeService.getEmployees({ 
      limit: '1000', 
      isActive: 'true'
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.totalEmployeesFound.set(res.pagination.total);
          // Fetch all active employees
          this.employees.set(res.data);
        }
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  loadTeam(id: string) {
    this.loading.set(true);
    this.teamService.getTeam(id).subscribe({
      next: (res) => {
        if (res.success) {
          const team = res.data;
          this.form.patchValue({
            teamLeaderId: team.teamLeaderId?._id || team.teamLeaderId,
            memberIds: team.memberIds?.map((m: any) => m._id || m) || []
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleMember(id: string) {
    const members = [...this.form.get('memberIds')?.value];
    const index = members.indexOf(id);
    if (index > -1) {
      members.splice(index, 1);
    } else {
      members.push(id);
    }
    this.form.patchValue({ memberIds: members });
  }

  isMemberSelected(id: string): boolean {
    return this.form.get('memberIds')?.value.includes(id);
  }

  getMemberPerf(id: string) {
    const p = this.performance();
    if (!p) return null;
    return p.membersProgress.find((m: any) => (m.employeeId._id || m.employeeId) === id);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.themeService.loading.set(true);
    
    const data = this.form.value;
    const obs = this.isEdit() 
      ? this.teamService.updateTeam(this.teamId()!, data)
      : this.teamService.createTeam(data);

    obs.subscribe({
      next: (res) => {
        this.themeService.loading.set(false);
        if (res.success) {
          this.router.navigate(['/teams']);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.themeService.loading.set(false);
      }
    });
  }
}
