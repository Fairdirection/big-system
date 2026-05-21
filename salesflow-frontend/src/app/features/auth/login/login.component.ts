import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

import { InputComponent } from '@shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      #loginCard
      (mousemove)="onMouseMove($event, loginCard)"
      (mouseleave)="onMouseLeave()"
      [style]="cardStyle()"
      class="grid grid-cols-1 lg:grid-cols-12 w-full max-w-[440px] lg:max-w-[1000px] rounded-[2.5rem] overflow-hidden glass-ultra border border-sf-border/30 shadow-3d relative group min-h-[620px]"
    >
      <!-- Premium Ambient Light Glow Layer behind the form -->
      <div class="absolute -top-36 -right-36 w-72 h-72 bg-sf-primary/5 rounded-full blur-3xl group-hover:bg-sf-primary/10 transition-colors duration-1000 pointer-events-none"></div>
      <div class="absolute -bottom-36 -left-36 w-72 h-72 bg-sf-secondary/5 rounded-full blur-3xl group-hover:bg-sf-secondary/10 transition-colors duration-1000 pointer-events-none"></div>

      <!-- Left Column: Premium Brand Showcase & Interactive SVG Telemetry Ring (Desktop Only) -->
      <div class="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-gradient-to-b from-sf-surface/60 to-sf-bg/40 border-l border-sf-border/20 overflow-hidden select-none">
        
        <!-- Subtle moving dust particles in background -->
        <div class="absolute inset-0 bg-mesh opacity-30 pointer-events-none"></div>
        
        <!-- Header: Logo Block -->
        <div class="relative z-10">
          <div class="inline-flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-glow-purple border border-sf-border/40">
              <img src="/logo.png" alt="fair direction Logo" class="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <h3 class="text-lg font-display font-black text-sf-text tracking-tight">الاتجاه العادل</h3>
              <p class="text-[9px] font-black text-sf-subtle uppercase tracking-widest">fair direction Premium</p>
            </div>
          </div>
        </div>

        <!-- Middle: Dynamic SVG Targets Telemetry Wheel -->
        <div class="relative z-10 py-6">
          <div class="relative w-56 h-56 mx-auto flex items-center justify-center">
            <!-- Ring 1: Outer Dot Ring (Clockwise) -->
            <svg class="absolute w-full h-full animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--sf-border) / 0.4)" stroke-width="1.5" stroke-dasharray="3 4" />
            </svg>
            
            <!-- Ring 2: Core Targets Progress Arc (Counter-Clockwise) -->
            <svg class="absolute w-[86%] h-[86%] animate-[spin_18s_linear_infinite_reverse]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#aurora-ring-grad)" stroke-width="3" stroke-dasharray="145 95" stroke-linecap="round" />
              <defs>
                <linearGradient id="aurora-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="rgb(var(--sf-primary))" />
                  <stop offset="50%" stop-color="rgb(var(--sf-info))" />
                  <stop offset="100%" stop-color="rgb(var(--sf-secondary))" />
                </linearGradient>
              </defs>
            </svg>
            
            <!-- Ring 3: Tech Grid Orbit Orbiting -->
            <svg class="absolute w-[74%] h-[74%] animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="rgb(var(--sf-primary) / 0.3)" stroke-width="1" stroke-dasharray="15 30 5 15" />
            </svg>
            
            <!-- Inner core stats display -->
            <div class="text-center z-10 pointer-events-none">
              <span class="block text-[10px] font-black text-sf-muted uppercase tracking-[0.2em] mb-1">دقة النظام</span>
              <span class="block text-4xl font-display font-black text-premium-gradient">99.9%</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sf-success/10 border border-sf-success/20 text-[9px] text-sf-success font-black mt-2 uppercase tracking-wide">
                <span class="w-1.5 h-1.5 rounded-full bg-sf-success animate-ping"></span>
                نشط وآمن
              </span>
            </div>
          </div>
        </div>

        <!-- Footer: Glowing target metrics -->
        <div class="relative z-10 flex items-center justify-between border-t border-sf-border/30 pt-6">
          <div class="space-y-1">
            <p class="text-sf-primary font-black text-2xl tracking-tighter">Instant</p>
            <p class="text-[9px] font-black text-sf-subtle uppercase tracking-wider">تقارير فورية</p>
          </div>
          <div class="w-px h-8 bg-sf-border/30"></div>
          <div class="space-y-1">
            <p class="text-sf-secondary font-black text-2xl tracking-tighter">+45%</p>
            <p class="text-[9px] font-black text-sf-subtle uppercase tracking-wider">نمو المبيعات</p>
          </div>
          <div class="w-px h-8 bg-sf-border/30"></div>
          <div class="space-y-1">
            <p class="text-sf-info font-black text-2xl tracking-tighter">Cloud</p>
            <p class="text-[9px] font-black text-sf-subtle uppercase tracking-wider">تزامن فوري</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Secure Credentials Form Layout -->
      <div class="lg:col-span-7 h-full flex flex-col justify-center p-8 md:p-14 bg-sf-surface/30 backdrop-blur-md relative z-10">
        
        <!-- Mobile Branding (Logo header displayed only on mobile screens) -->
        <div class="lg:hidden text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-glow-purple mx-auto mb-4 border border-sf-border/30 animate-pulse">
            <img src="/logo.png" alt="fair direction Logo" class="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 class="text-2xl font-display font-black text-sf-text tracking-tight">الاتجاه العادل</h1>
          <p class="text-[9px] font-black text-sf-subtle uppercase tracking-widest mt-1">المنصة الذكية للمبيعات العقارية</p>
        </div>

        <!-- Form headers -->
        <div class="mb-8 text-right">
          <h2 class="text-3xl md:text-4xl font-display font-black text-sf-text mb-2 tracking-tight">أهلاً بك مجدداً</h2>
          <p class="text-sf-muted text-sm font-medium">الرجاء إدخال بياناتك للوصول إلى حسابك الآمن.</p>
        </div>

        <!-- Core Authentication Form -->
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
          <app-input
            label="البريد الإلكتروني"
            type="email"
            placeholder="admin@fairdirection.com"
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

          <!-- Modern Dynamic Error Message panel -->
          @if (errorMsg()) {
            <div class="px-4 py-3 rounded-2xl bg-sf-error/10 border border-sf-error/20
                        text-sf-error text-xs flex items-center gap-3 animate-shake">
              <div class="w-2 h-2 rounded-full bg-sf-error animate-pulse"></div>
              <span class="font-bold">{{ errorMsg() }}</span>
            </div>
          }

          <!-- Premium Customized Interactive Submit Button -->
          <div class="pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="group relative w-full h-12 rounded-xl overflow-hidden font-display font-black text-white text-base
                     bg-gradient-to-r from-sf-primary via-sf-info to-sf-secondary bg-[size:200%_auto] hover:bg-right
                     disabled:opacity-40 disabled:pointer-events-none
                     shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.5)]
                     transition-all duration-500 transform active:scale-[0.98]
                     flex items-center justify-center gap-3">
              
              <!-- Shimmer Sheen Reflection Sweeper -->
              <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
              
              <!-- Subtle inner top border highlight -->
              <div class="absolute inset-x-0 top-0 h-[1px] bg-white/20"></div>

              <!-- Loading Indicator -->
              @if (loading()) {
                <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>جاري فتح البوابة الآمنة...</span>
              } @else {
                <span class="tracking-wide">دخول آمن للمنصة</span>
                
                <!-- Micro-interactive Arrow Icon (moves left in RTL) -->
                <svg class="w-5 h-5 text-white transform group-hover:-translate-x-1 transition-transform duration-300" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              }
            </button>
          </div>
        </form>

        <!-- Help Desk Footer links -->
        <div class="mt-10 pt-6 border-t border-sf-border/30 text-center">
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

  // 3D Card Tilt mouse parallax signals
  cardStyle = signal<string>('');

  onMouseMove(event: MouseEvent, element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Normalized coordinates around card center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 5; // Limit rotation to max 5 degrees
    const rotateX = -((y - centerY) / centerY) * 5;
    
    this.cardStyle.set(`transform: perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.012, 1.012, 1.012); transition: transform 0.1s cubic-bezier(0.25, 0.8, 0.25, 1);`);
  }

  onMouseLeave() {
    this.cardStyle.set('transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1); transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);');
  }

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

