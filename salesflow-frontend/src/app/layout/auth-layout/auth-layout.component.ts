import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex overflow-hidden relative font-body">
      <!-- Ambient Background -->
      <div class="absolute inset-0 bg-mesh opacity-50"></div>
      
      <!-- Floating Decorative Elements -->
      <div class="absolute top-1/4 left-10 w-64 h-64 bg-sf-primary/20 rounded-full blur-[100px] animate-float"></div>
      <div class="absolute bottom-1/4 right-10 w-96 h-96 bg-sf-secondary/10 rounded-full blur-[120px] animate-float-delayed"></div>

      <!-- Main Content Split -->
      <div class="relative z-10 flex w-full">
        
        <!-- Left: Branding & Value Prop (Desktop only) -->
        <div class="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 bg-sf-surface/10 backdrop-blur-md border-r border-white/5">
          <div class="max-w-xl">
            <div class="w-16 h-16 rounded-3xl bg-gradient-purple shadow-glow-purple flex items-center justify-center mb-10 animate-float">
              <span class="text-white font-display font-bold text-2xl">SF</span>
            </div>
            
            <h2 class="text-5xl xl:text-6xl font-display font-black text-white leading-tight mb-6">
              ارتقِ بإدارة <br/> 
              <span class="text-gradient-primary">مبيعاتك وعمولاتك</span>
            </h2>
            
            <p class="text-xl text-sf-muted font-medium mb-12 leading-relaxed">
              سيلز فلو هو النظام المتكامل الذي يمنحك الرؤية الكاملة لأداء فريقك وتحصيلاتك المالية بكل ذكاء وسهولة.
            </p>

            <div class="grid grid-cols-2 gap-8">
              <div class="space-y-2">
                <h4 class="text-sf-primary font-black text-2xl tracking-tighter">100%</h4>
                <p class="text-xs font-bold text-sf-muted uppercase tracking-widest">دقة متناهية</p>
              </div>
              <div class="space-y-2">
                <h4 class="text-sf-secondary font-black text-2xl tracking-tighter">Real-time</h4>
                <p class="text-xs font-bold text-sf-muted uppercase tracking-widest">تحديثات فورية</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Login Form -->
        <div class="flex-1 flex flex-col justify-center items-center p-8 bg-sf-bg/40 backdrop-blur-sm">
          <div class="w-full max-w-md animate-fade-in">
            <!-- Mobile Logo -->
            <div class="lg:hidden text-center mb-10">
              <div class="w-12 h-12 rounded-2xl bg-gradient-purple shadow-glow-purple flex items-center justify-center mx-auto mb-4">
                <span class="text-white font-display font-bold text-xl">SF</span>
              </div>
              <h1 class="text-2xl font-display font-black text-white">سيلز فلو</h1>
            </div>

            <router-outlet />
            
            <footer class="mt-12 text-center">
              <p class="text-sf-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                &copy; 2024 SalesFlow. All Rights Reserved.
              </p>
            </footer>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
