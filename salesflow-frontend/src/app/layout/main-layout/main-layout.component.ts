import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { BottomNavComponent } from '@shared/components/bottom-nav/bottom-nav.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { NavLoadingBarComponent } from '@shared/components/nav-loading-bar/nav-loading-bar.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { LayoutService } from '@core/services/layout.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, BottomNavComponent, BreadcrumbComponent, NavLoadingBarComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg overflow-x-hidden relative selection:bg-sf-primary/30 font-body" [dir]="langService.currentDir()">
      <!-- Mesh Background -->
      <div class="fixed inset-0 bg-mesh opacity-60 pointer-events-none z-0"></div>

      <!-- Router progress bar -->
      <app-nav-loading-bar />

      <!-- Navbar -->
      <app-navbar
        class="fixed top-0 left-0 z-40 transition-[right] duration-300 w-full lg:w-auto"
        [class.lg:right-72]="sidebarExpanded()"
        [class.lg:right-20]="!sidebarExpanded()"
      />

      <div class="flex pt-16 h-full relative z-10">
        <!-- Sidebar -->
        <app-sidebar />

        <!-- Main Content -->
        <main
          class="flex-1 min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8
                 pb-24 lg:pb-8
                 transition-[margin] duration-300 ease-in-out w-full lg:w-auto"
          [class.lg:mr-72]="sidebarExpanded()"
          [class.lg:mr-20]="!sidebarExpanded()">
          <div class="max-w-[1600px] mx-auto">
            <!-- Breadcrumb (auto-generates from route, hidden on root pages) -->
            <div class="mb-5">
              <app-breadcrumb />
            </div>
            <router-outlet />
          </div>
        </main>
      </div>

      <!-- Mobile bottom navigation -->
      <app-bottom-nav />

      <!-- Global confirm dialog -->
      <app-confirm-dialog />
    </div>
  `,
})
export class MainLayoutComponent {
  private layoutService = inject(LayoutService);
  langService = inject(LanguageService);
  sidebarExpanded = this.layoutService.sidebarExpanded;
}
