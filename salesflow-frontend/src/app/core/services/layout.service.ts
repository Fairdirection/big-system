import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  sidebarExpanded = signal(true);
  mobileMenuOpen = signal(false);

  toggleSidebar() {
    this.sidebarExpanded.update(v => !v);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  setSidebar(expanded: boolean) {
    this.sidebarExpanded.set(expanded);
  }
}
