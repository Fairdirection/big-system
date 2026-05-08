import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex items-center justify-center overflow-hidden relative font-body selection:bg-sf-primary/30 text-sf-text p-4 md:p-8">
      <!-- High-End Mesh & Cyber Dot Grid Background -->
      <div class="absolute inset-0 bg-mesh opacity-70"></div>
      <div class="absolute inset-0 bg-grid-cyber"></div>
      
      <!-- Immersive Aurora Dome Background Blurs (Animated & Fluid) -->
      <div class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-sf-primary/8 blur-[140px] animate-aurora-1 pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-sf-secondary/8 blur-[160px] animate-aurora-2 pointer-events-none" style="animation-delay: -5s"></div>
      <div class="absolute top-[30%] right-[25%] w-[35vw] h-[35vw] rounded-full bg-sf-info/6 blur-[120px] animate-aurora-3 pointer-events-none" style="animation-delay: -10s"></div>

      <!-- Centered Routing Outlet Container -->
      <div class="relative z-10 w-full flex items-center justify-center animate-fade-in py-6">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .bg-grid-cyber {
      background-size: 50px 50px;
      background-image: radial-gradient(circle, rgb(var(--sf-border) / 0.15) 1px, transparent 1px);
    }
  `]
})
export class AuthLayoutComponent {}

