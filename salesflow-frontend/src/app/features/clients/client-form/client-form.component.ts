import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService } from '@core/services/client.service';
import { InputComponent } from '@shared/components/input/input.component';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroChevronRight, heroCheck, heroUser } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, NgIconComponent],
  providers: [
    provideIcons({ heroChevronRight, heroCheck, heroUser })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 hover:bg-sf-surface rounded-xl transition-colors">
            <ng-icon name="heroChevronRight" class="text-xl"></ng-icon>
          </button>
          <h1 class="text-3xl font-display font-bold text-sf-text">
            {{ isEdit() ? 'تعديل بيانات العميل' : 'إضافة عميل جديد' }}
          </h1>
        </div>
        <button (click)="submit()" [disabled]="form.invalid || isSubmitting()" 
                class="btn btn-primary px-8 py-2.5 flex items-center gap-2">
          <ng-icon name="heroCheck"></ng-icon>
          <span>{{ isEdit() ? 'تحديث البيانات' : 'حفظ العميل' }}</span>
        </button>
      </header>

      <form [formGroup]="form" class="glass-card p-8 rounded-3xl border border-sf-border shadow-2xl space-y-8">
        <div class="flex flex-col items-center pb-6 border-b border-sf-border/30">
          <div class="w-20 h-20 rounded-full bg-sf-bg border border-sf-border flex items-center justify-center text-sf-primary text-3xl mb-4 shadow-inner">
            <ng-icon name="heroUser"></ng-icon>
          </div>
          <p class="text-xs font-black text-sf-muted uppercase tracking-widest">
            {{ isEdit() ? 'تعديل الملف الشخصي' : 'علاقة جديدة' }}
          </p>
        </div>

        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">الاسم بالكامل / الشركة</label>
            <app-input formControlName="name" placeholder="مثال: شركة أكمي أو أحمد محمد"
                       [hasError]="isInvalid('name')"
                       errorMessage="الاسم مطلوب"
                       hint="يرجى كتابة اسم العميل أو اسم المؤسسة"></app-input>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">البريد الإلكتروني</label>
              <app-input type="email" formControlName="email" placeholder="client@example.com"
                         [hasError]="isInvalid('email')"
                         errorMessage="يرجى إدخال بريد صالح"
                         hint="اختياري: لتلقي الإشعارات"></app-input>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">رقم الهاتف</label>
              <app-input formControlName="phone" placeholder="01XXXXXXXXX"
                         [hasError]="isInvalid('phone')"
                         errorMessage="رقم الهاتف مطلوب"
                         hint="رقم التواصل الأساسي"></app-input>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-sf-muted uppercase tracking-widest mr-1">كود العميل</label>
            <app-input formControlName="code" placeholder="مثال: CLI-001"
                       [hasError]="isInvalid('code')"
                       errorMessage="الكود مطلوب"
                       hint="معرف فريد يستخدم للتتبع"></app-input>
          </div>
        </div>

        <div class="p-4 bg-sf-info/5 border border-sf-info/20 rounded-2xl flex items-start gap-3">
          <div class="p-1.5 bg-sf-info/20 rounded-lg text-sf-info">
            <ng-icon name="heroCheck"></ng-icon>
          </div>
          <div>
            <h4 class="text-xs font-bold text-sf-text uppercase tracking-tight">حالة النشاط</h4>
            <p class="text-[10px] text-sf-muted font-medium">العملاء نشطون افتراضيًا للسماح بإدخال المبيعات الفورية.</p>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);

  form!: FormGroup;
  isSubmitting = signal(false);
  isEdit = signal(false);
  clientId = signal<string | null>(null);

  ngOnInit() {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.clientId.set(id);
      this.loadClient(id);
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required]],
      code: ['', [Validators.required]],
      isActive: [true]
    });
  }

  private loadClient(id: string) {
    this.clientService.getClient(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.form.patchValue(res.data);
        }
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  goBack() {
    this.router.navigate(['/clients']);
  }

  submit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const obs = this.isEdit() 
      ? this.clientService.updateClient(this.clientId()!, this.form.value)
      : this.clientService.createClient(this.form.value);

    obs.subscribe({
      next: () => this.router.navigate(['/clients']),
      error: () => this.isSubmitting.set(false)
    });
  }
}
