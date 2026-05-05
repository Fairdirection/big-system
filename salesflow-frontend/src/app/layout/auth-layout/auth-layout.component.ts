import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex overflow-hidden relative font-body selection:bg-sf-primary/30 text-sf-text">
      <!-- High-End Mesh Background -->
      <div class="absolute inset-0 bg-mesh opacity-40"></div>
      
      <!-- Artistic Floating Elements -->
      <div class="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-sf-primary/10 rounded-full blur-[120px] animate-float"></div>
      <div class="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-sf-secondary/5 rounded-full blur-[150px] animate-float" style="animation-delay: -2s"></div>

      <!-- Main Layout -->
      <div class="relative z-10 flex w-full">
        
        <!-- Left: Brand Experience (Desktop Only) -->
        <div class="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-32 relative overflow-hidden">
          <div class="relative z-10 max-w-2xl">
            <div class="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-sf-primary to-sf-secondary shadow-glow-purple flex items-center justify-center mb-12 animate-float">
              <span class="text-white font-display font-black text-3xl">SF</span>
            </div>
            
            <h2 class="text-6xl xl:text-7xl font-display font-black text-sf-text leading-[1.1] mb-8 tracking-tighter">
              إدارة ذكية <br/> 
              <span class="text-premium-gradient">لمبيعاتك وعمولاتك</span>
            </h2>
            
            <p class="text-xl text-sf-muted font-medium mb-16 leading-relaxed max-w-lg">
              انضم إلى الجيل القادم من أنظمة إدارة المبيعات. دقة، سرعة، ورؤية شاملة لأدق تفاصيل عملك.
            </p>

            <div class="flex items-center gap-12">
              <div class="space-y-2">
                <p class="text-sf-primary font-black text-3xl tracking-tighter">99.9%</p>
                <p class="text-[10px] font-black text-sf-subtle uppercase tracking-[0.2em]">دقة البيانات</p>
              </div>
              <div class="w-px h-12 bg-sf-border/50"></div>
              <div class="space-y-2">
                <p class="text-sf-secondary font-black text-3xl tracking-tighter">Instant</p>
                <p class="text-[10px] font-black text-sf-subtle uppercase tracking-[0.2em]">تقارير فورية</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Auth Container -->
        <div class="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
          <div class="w-full max-w-[480px] animate-fade-in">
            <!-- Mobile Branding -->
            <div class="lg:hidden text-center mb-12">
              <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-sf-primary to-sf-secondary shadow-glow-purple flex items-center justify-center mx-auto mb-6">
                <span class="text-white font-display font-black text-2xl">SF</span>
              </div>
              <h1 class="text-3xl font-display font-black text-sf-text tracking-tight">سيلز فلو</h1>
            </div>

            <!-- Login Form Outlet -->
            <div class="relative">
               <router-outlet />
            </div>
            
            <footer class="mt-16 text-center">
              <p class="text-sf-subtle text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
                &copy; 2024 SalesFlow Premium Experience
              </p>
            </footer>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
