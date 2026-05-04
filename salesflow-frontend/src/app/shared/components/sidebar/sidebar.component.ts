import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@core/services/layout.service';
import {
  heroSquares2x2,
  heroUsers,
  heroBriefcase,
  heroCurrencyDollar,
  heroDocumentText,
  heroUserGroup,
  heroCog6Tooth,
  heroChartBar,
  heroArrowRightOnRectangle,
} from '@ng-icons/heroicons/outline';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIconComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({
    heroSquares2x2, heroUsers, heroBriefcase,
    heroCurrencyDollar, heroDocumentText,
    heroUserGroup, heroCog6Tooth, heroChartBar, heroArrowRightOnRectangle,
  })],
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  expanded = this.layoutService.sidebarExpanded;
  mobileMenuOpen = this.layoutService.mobileMenuOpen;
  currentUser = this.authService.currentUser;

  navItems: NavItem[] = [
    { path: '/dashboard',  label: 'لوحة التحكم',  icon: 'heroSquares2x2' },
    { path: '/employees',  label: 'الموظفين',      icon: 'heroUsers' },
    { path: '/teams',      label: 'الفرق',        icon: 'heroUserGroup' },
    { path: '/clients',    label: 'العملاء',      icon: 'heroBriefcase' },
    { path: '/sales',      label: 'المبيعات',     icon: 'heroCurrencyDollar' },
    { path: '/claims',     label: 'المطالبات',    icon: 'heroDocumentText' },
    { path: '/targets',    label: 'المستهدفات',   icon: 'heroChartBar' },
    { path: '/settings',   label: 'الإعدادات',     icon: 'heroCog6Tooth' },
  ];

  toggle() { this.layoutService.toggleSidebar(); }
  closeMobileMenu() { this.layoutService.mobileMenuOpen.set(false); }

  logout() {
    this.authService.logout().subscribe();
    // Navigate immediately for better UX
  }
}
