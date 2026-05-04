import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from '@core/services/employee.service';
import { InputComponent } from '@shared/components/input/input.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronLeft, heroCheck } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, NgIconComponent],
  providers: [
    provideIcons({ heroChevronLeft, heroCheck })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>
          <h1 class="text-3xl font-display font-bold text-sf-text">
            {{ isEditMode() ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد' }}
          </h1>
        </div>
        <div class="flex flex-col items-end gap-1">
          <button (click)="submit()" [disabled]="isSubmitting()" 
                  class="btn btn-primary px-8 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <ng-icon *ngIf="!isSubmitting()" name="heroCheck"></ng-icon>
            <span *ngIf="isSubmitting()" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ isSubmitting() ? 'جاري الحفظ...' : 'حفظ الموظف' }}</span>
          </button>
          <p *ngIf="form.invalid && form.touched" class="text-[10px] text-sf-error font-bold">يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح.</p>
        </div>
      </header>

      <!-- Global Error Message -->
      <div *ngIf="errorMessage()" class="p-4 bg-sf-error/10 border border-sf-error/30 rounded-2xl flex items-center gap-3 text-sf-error animate-fade-in">
        <div class="w-2 h-2 bg-sf-error rounded-full animate-pulse"></div>
        <p class="text-sm font-bold">{{ errorMessage() }}</p>
      </div>

      <form *ngIf="!isLoading(); else skeleton" [formGroup]="form" class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-8">
        <!-- Identity -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">الهوية الشخصية</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الاسم الكامل</label>
              <app-input formControlName="name" placeholder="مثال: أحمد محمد" 
                         [hasError]="isInvalid('name')"
                         errorMessage="الاسم الكامل مطلوب"
                         hint="يرجى كتابة الاسم كما هو في البطاقة الشخصية"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الرقم القومي</label>
              <app-input formControlName="nationalId" placeholder="14 رقم"
                         [hasError]="isInvalid('nationalId')"
                         errorMessage="يرجى إدخال 14 رقماً صحيحاً"
                         hint="تأكد من إدخال 14 رقماً صحيحاً"></app-input>
            </div>
          </div>
        </section>

        <!-- Professional -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">التفاصيل المهنية</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">القسم</label>
              <select formControlName="department" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text h-[42px] focus:ring-2 focus:ring-sf-primary/50 outline-none">
                <option value="Sales">المبيعات</option>
                <option value="Operations">العمليات</option>
                <option value="Marketing">التسويق</option>
                <option value="Finance">المالية</option>
                <option value="IT">تكنولوجيا المعلومات</option>
                <option value="HR">الموارد البشرية</option>
                <option value="TopManagement">الإدارة العليا</option>
              </select>
              <p class="text-[10px] text-sf-muted mr-1">القسم الوظيفي التابع له الموظف</p>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المسمى الوظيفي</label>
              <app-input formControlName="jobTitle" placeholder="مثال: مسؤول مبيعات"
                         [hasError]="isInvalid('jobTitle')"
                         errorMessage="المسمى الوظيفي مطلوب"
                         hint="المسمى المعتمد في العقد"></app-input>
            </div>
            <div class="space-y-2" *ngIf="form.get('department')?.value === 'Sales'">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستوى الوظيفي</label>
              <select formControlName="seniorityLevel" class="w-full px-4 py-2.5 bg-sf-bg border border-sf-border rounded-xl text-sm text-sf-text h-[42px] focus:ring-2 focus:ring-sf-primary/50 outline-none">
                <option value="Fresh">مبتدئ (Fresh)</option>
                <option value="BA">مساعد (BA)</option>
                <option value="BC">استشاري (BC)</option>
                <option value="Senior">سينيور (Senior)</option>
                <option value="SV">مشرف (SV)</option>
                <option value="TeamLeader">قائد فريق</option>
                <option value="SalesManager">مدير مبيعات</option>
              </select>
              <p class="text-[10px] text-sf-muted mr-1">يحدد صلاحيات الموظف في النظام</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">المستهدف الربعي (ج.م)</label>
              <app-input type="number" formControlName="target" placeholder="0.00"
                         hint="المبلغ المطلوب تحقيقه خلال 3 أشهر"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">تاريخ التعيين</label>
              <app-input type="date" formControlName="hireDate"
                         [hasError]="isInvalid('hireDate')"
                         errorMessage="تاريخ التعيين مطلوب"
                         hint="تاريخ بدء العمل الفعلي"></app-input>
            </div>
          </div>
        </section>

        <!-- Contact -->
        <section class="space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-sf-border/30">
            <h3 class="text-lg font-display font-bold text-sf-text">معلومات الاتصال</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">البريد الإلكتروني للعمل</label>
              <app-input type="email" formControlName="email" placeholder="email@salesflow.com"
                         [hasError]="isInvalid('email')"
                         errorMessage="يرجى إدخال بريد إلكتروني صالح"
                         hint="سيتم استخدامه لتسجيل الدخول"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">رقم الهاتف</label>
              <app-input formControlName="phone" placeholder="01XXXXXXXXX"
                         [hasError]="isInvalid('phone')"
                         errorMessage="رقم الهاتف مطلوب"
                         hint="يفضل رقم الواتساب للتواصل"></app-input>
            </div>
          </div>
        </section>
      </form>

      <ng-template #skeleton>
        <div class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-12 animate-pulse">
          <div class="h-8 w-48 bg-sf-surface skeleton rounded-lg"></div>
          <div class="grid grid-cols-2 gap-8">
            <div class="h-16 bg-sf-surface skeleton rounded-xl" *ngFor="let i of [1,2,3,4,5,6]"></div>
          </div>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private employeeService = inject(EmployeeService);

  form!: FormGroup;
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  errorMessage = signal<string | null>(null);
  employeeId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  private checkEditMode() {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.isLoading.set(true);
      this.employeeService.getEmployee(this.employeeId).subscribe({
        next: (res) => {
          const emp = res.data;
          this.form.patchValue({
            name: emp.name,
            nationalId: emp.nationalId,
            department: emp.department,
            jobTitle: emp.jobTitle,
            seniorityLevel: emp.seniorityLevel,
            target: emp.target,
            hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '',
            email: emp.email,
            phone: emp.phone,
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.goBack();
        }
      });
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      nationalId: ['', [Validators.required, Validators.pattern(/^[0-9]{14}$/)]],
      department: ['Sales', [Validators.required]],
      jobTitle: [''],
      seniorityLevel: ['Fresh'],
      target: [0],
      hireDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      managerId: ['69f60230c2120b7ce02988dd'] // Placeholder manager (Adham)
    });

    // Handle conditional seniority level
    this.form.get('department')?.valueChanges.subscribe(dept => {
      if (dept !== 'Sales') {
        this.form.get('seniorityLevel')?.setValue(null);
      } else {
        this.form.get('seniorityLevel')?.setValue('Fresh');
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack() {
    this.router.navigate(['/employees']);
  }

  submit() {
    if (this.form.invalid) {
      console.log('Form is invalid:', this.form.errors);
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.invalid) {
          console.log(`Field ${key} is invalid:`, control.errors);
        }
      });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const data = { ...this.form.value };
    
    const obs = this.isEditMode() 
      ? this.employeeService.updateEmployee(this.employeeId!, data)
      : this.employeeService.createEmployee(data);

    obs.subscribe({
      next: () => {
        this.employeeService.invalidateCache();
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        console.error('Submit error:', err);
        this.isSubmitting.set(false);
        
        // Handle specific backend errors
        if (err.status === 409) {
          const msg = err.error?.message || '';
          if (msg.includes('nationalId')) {
            this.errorMessage.set('الرقم القومي مسجل مسبقاً لموظف آخر.');
          } else if (msg.includes('email')) {
            this.errorMessage.set('البريد الإلكتروني مسجل مسبقاً لموظف آخر.');
          } else {
            this.errorMessage.set('هذه البيانات مسجلة مسبقاً.');
          }
        } else if (err.status === 400) {
          this.errorMessage.set('يرجى التأكد من صحة جميع البيانات المدخلة.');
        } else {
          this.errorMessage.set('حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
        }
      }
    });
  }
}
