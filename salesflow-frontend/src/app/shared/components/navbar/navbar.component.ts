import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { LayoutService } from '@core/services/layout.service';
import { LanguageService } from '@core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBars3, heroXMark, heroMoon, heroSun, heroCalendar } from '@ng-icons/heroicons/outline';
import { formatQuarter } from '@core/utils/quarter.utils';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslateModule],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ heroBars3, heroXMark, heroMoon, heroSun, heroCalendar })
  ]
})
export class NavbarComponent {
  private auth = inject(AuthService);
  public theme = inject(ThemeService);
  private layout = inject(LayoutService);
  public langService = inject(LanguageService);
  private translate = inject(TranslateService);

  currentUser = this.auth.currentUser;
  isDark = this.theme.isDark;
  mobileMenuOpen = this.layout.mobileMenuOpen;

  roleLabel = computed(() => {
    const role = this.currentUser()?.role ?? '';
    return this.translate.instant(role ? `roles.${role}` : 'roles.user');
  });

  toggleTheme() { this.theme.toggle(); }
  toggleMobileMenu() { this.layout.toggleMobileMenu(); }

  onQuarterChange(event: Event) {
    this.theme.setQuarter((event.target as HTMLSelectElement).value);
  }

  formatQ(q: string) { return formatQuarter(q); }
}
