import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { LayoutService } from '@core/services/layout.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBars3, heroXMark, heroMoon, heroSun, heroCalendar } from '@ng-icons/heroicons/outline';
import { formatQuarter } from '@core/utils/quarter.utils';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
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

  currentUser = this.auth.currentUser;
  isDark = this.theme.isDark;
  mobileMenuOpen = this.layout.mobileMenuOpen;

  toggleTheme() { 
    console.log('Navbar: Toggle button clicked');
    this.theme.toggle(); 
  }
  toggleMobileMenu() { this.layout.toggleMobileMenu(); }

  onQuarterChange(event: any) {
    this.theme.setQuarter(event.target.value);
  }

  formatQ(q: string) {
    return formatQuarter(q);
  }
}
