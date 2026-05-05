import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-ultra p-10 rounded-[2.5rem] relative overflow-hidden group">
      <!-- Sophisticated Decorative Glow -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-sf-primary/5 rounded-full blur-3xl group-hover:bg-sf-primary/10 transition-colors duration-700"></div>
      
      <div class="relative z-10">
        <div class="mb-10">
          <h2 class="text-4xl font-display font-black text-sf-text mb-2 tracking-tight">أهلاً بك مجدداً</h2>
          <p class="text-sf-muted text-sm font-medium">الرجاء إدخال بياناتك للوصول إلى حسابك الآمن.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
          <app-input
            label="البريد الإلكتروني"
            type="email"
            placeholder="admin@salesflow.com"
            formControlName="email"
            [hasError]="emailInvalid"
            [errorMessage]="'أدخل بريداً إلكترونياً صالحاً'"
            [required]="true" />

          <div class="space-y-1">
            <app-input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              formControlName="password"
              [hasError]="passwordInvalid"
              [errorMessage]="'كلمة المرور مطلوبة'"
              [required]="true" />
            <div class="flex justify-end pr-1">
              <a href="#" class="text-[10px] font-black text-sf-primary hover:text-sf-secondary transition-colors uppercase tracking-[0.1em]">نسيت كلمة المرور؟</a>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="px-4 py-3 rounded-2xl bg-sf-error/10 border border-sf-error/20
                        text-sf-error text-xs flex items-center gap-3 animate-shake">
              <div class="w-1.5 h-1.5 rounded-full bg-sf-error"></div>
              <span class="font-bold">{{ errorMsg() }}</span>
            </div>
          }

          <div class="pt-4">
            <app-button
              type="submit"
              variant="primary"
              size="lg"
              [loading]="loading()"
              [disabled]="form.invalid"
              class="w-full shadow-glow-purple">
              دخول آمن للنظام
            </app-button>
          </div>
        </form>

        <div class="mt-12 pt-8 border-t border-sf-border/30 text-center">
          <p class="text-sm text-sf-muted font-medium">
            ليس لديك حساب؟ 
            <a href="#" class="text-sf-primary font-black hover:text-sf-secondary transition-colors mr-1">تواصل مع الإدارة</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  errorMsg = signal('');

  get emailInvalid() {
    const c = this.form.get('email');
    return !!(c?.invalid && c?.touched);
  }
  get passwordInvalid() {
    const c = this.form.get('password');
    return !!(c?.invalid && c?.touched);
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'بيانات الدخول غير صحيحة');
        this.loading.set(false);
      },
    });
  }
}
