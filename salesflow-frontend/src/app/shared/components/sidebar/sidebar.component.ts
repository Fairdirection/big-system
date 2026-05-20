import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/services/auth.service';
import { LayoutService } from '@core/services/layout.service';
import { LanguageService } from '@core/services/language.service';
import { AvatarUploadComponent } from '@shared/components/avatar-upload/avatar-upload.component';
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
  heroBanknotes,
  heroCamera,
} from '@ng-icons/heroicons/outline';

interface NavItem { path: string; label: string; icon: string; }
interface NavSection { label?: string; items: NavItem[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIconComponent, TranslateModule, AvatarUploadComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({
    heroSquares2x2, heroUsers, heroBriefcase,
    heroCurrencyDollar, heroDocumentText,
    heroUserGroup, heroCog6Tooth, heroChartBar, heroArrowRightOnRectangle,
    heroBanknotes, heroCamera,
  })],
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private translate = inject(TranslateService);
  langService = inject(LanguageService);

  expanded = this.layoutService.sidebarExpanded;
  mobileMenuOpen = this.layoutService.mobileMenuOpen;
  currentUser = this.authService.currentUser;
  avatarUploadOpen = signal(false);

  get roleLabel(): string {
    const role = this.currentUser()?.role ?? '';
    const key = role ? `roles.${role}` : 'roles.user';
    return this.translate.instant(key);
  }

  get roleBadgeClass(): string {
    const map: Record<string, string> = {
      admin:    'bg-sf-primary/10 text-sf-primary border-sf-primary/20',
      manager:  'bg-sf-info/10 text-sf-info border-sf-info/20',
      employee: 'bg-sf-success/10 text-sf-success border-sf-success/20',
    };
    return map[this.currentUser()?.role ?? ''] ?? 'bg-sf-elevated text-sf-muted border-sf-border/50';
  }

  // Labels are translation keys — resolved in the template via | translate
  navSections: NavSection[] = [
    {
      items: [
        { path: '/dashboard', label: 'nav.dashboard', icon: 'heroSquares2x2' },
      ],
    },
    {
      label: 'nav.team_management',
      items: [
        { path: '/employees', label: 'nav.employees', icon: 'heroUsers' },
        { path: '/teams',     label: 'nav.teams',     icon: 'heroUserGroup' },
        { path: '/clients',   label: 'nav.clients',   icon: 'heroBriefcase' },
      ],
    },
    {
      label: 'nav.transactions',
      items: [
        { path: '/sales',  label: 'nav.sales',  icon: 'heroCurrencyDollar' },
        { path: '/claims', label: 'nav.claims', icon: 'heroDocumentText' },
      ],
    },
    {
      label: 'nav.analytics',
      items: [
        { path: '/targets',     label: 'nav.targets',     icon: 'heroChartBar' },
        { path: '/commissions', label: 'nav.commissions', icon: 'heroBanknotes' },
      ],
    },
    {
      label: 'nav.system',
      items: [
        { path: '/settings', label: 'nav.settings', icon: 'heroCog6Tooth' },
      ],
    },
  ];

  toggle() { this.layoutService.toggleSidebar(); }
  closeMobileMenu() { this.layoutService.mobileMenuOpen.set(false); }
  logout() { this.authService.logout().subscribe(); }
}
