import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { LayoutService } from '@core/services/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg overflow-x-hidden rtl relative selection:bg-sf-primary/30 font-body" dir="rtl">
      <!-- Sophisticated Mesh Background -->
      <div class="fixed inset-0 bg-mesh opacity-60 pointer-events-none z-0"></div>
      
      <!-- Navbar -->
      <app-navbar 
        class="fixed top-0 left-0 z-40 transition-all duration-300
               w-full lg:w-auto"
        [class.lg:right-72]="sidebarExpanded()"
        [class.lg:right-20]="!sidebarExpanded()"
      />

      <div class="flex pt-16 h-full relative z-10">
        <!-- Sidebar -->
        <app-sidebar />

        <!-- Main Content -->
        <main
          class="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-8 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                 w-full lg:w-auto"
          [class.lg:mr-72]="sidebarExpanded()"
          [class.lg:mr-20]="!sidebarExpanded()">
          <div class="max-w-[1600px] mx-auto animate-fade-in">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  private layoutService = inject(LayoutService);
  sidebarExpanded = this.layoutService.sidebarExpanded;
}
