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
    <div class="glass-ultra p-10 rounded-[2.5rem] border border-white/10 shadow-glow-purple/20 relative overflow-hidden group">
      <!-- Decorative Glow -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-sf-primary/10 rounded-full blur-3xl group-hover:bg-sf-primary/20 transition-colors duration-700"></div>
      
      <div class="relative z-10">
        <div class="mb-8">
          <h2 class="text-3xl font-display font-black text-white mb-2">أهلاً بك مجدداً</h2>
          <p class="text-sf-muted text-sm font-medium">الرجاء إدخال بياناتك للوصول إلى حسابك.</p>
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
            <div class="flex justify-end">
              <a href="#" class="text-[11px] font-bold text-sf-primary hover:text-sf-secondary transition-colors uppercase tracking-widest">نسيت كلمة المرور؟</a>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="px-4 py-3 rounded-2xl bg-neon-pink/10 border border-neon-pink/20
                        text-neon-pink text-xs flex items-center gap-3 animate-shake">
              <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"/>
              </svg>
              <span class="font-bold">{{ errorMsg() }}</span>
            </div>
          }

          <div class="pt-2">
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

        <div class="mt-10 pt-8 border-t border-white/5 text-center">
          <p class="text-sm text-sf-muted">
            ليس لديك حساب؟ 
            <a href="#" class="text-white font-bold hover:text-sf-primary transition-colors">تواصل مع الإدارة</a>
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
