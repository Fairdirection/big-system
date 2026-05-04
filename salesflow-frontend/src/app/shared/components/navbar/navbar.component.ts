import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { formatQuarter } from '@core/utils/quarter.utils';
import { LayoutService } from '@core/services/layout.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBars3, heroXMark, heroMoon, heroSun } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgIconComponent, FormsModule],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({ heroBars3, heroXMark, heroMoon, heroSun })
  ]
})
export class NavbarComponent {
  private auth = inject(AuthService);
  public theme = inject(ThemeService);
  private layout = inject(LayoutService);

  currentUser = this.auth.currentUser;
  isDark = this.theme.isDark;
  currentQuarter = this.theme.currentQuarter;
  availableQuarters = this.theme.availableQuarters;
  loading = this.theme.loading;
  mobileMenuOpen = this.layout.mobileMenuOpen;

  toggleTheme() { 
    console.log('Navbar: Toggle button clicked');
    this.theme.toggle(); 
  }
  toggleMobileMenu() { this.layout.toggleMobileMenu(); }
  onQuarterChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.theme.setQuarter(val);
  }

  formatQ(q: string) {
    return formatQuarter(q);
  }
}
