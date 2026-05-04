import { Injectable, signal, computed, effect } from '@angular/core';
import { getQuarterId, getAvailableQuarters } from '@core/utils/quarter.utils';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>(this.loadTheme());
  private _quarter = signal<string>(this.loadQuarter());

  isDark = computed(() => this._theme() === 'dark');
  currentTheme = this._theme.asReadonly();
  currentQuarter = this._quarter.asReadonly();
  availableQuarters = signal(getAvailableQuarters());
  loading = signal(false);

  constructor() {
    // Sync theme to DOM on every change
    effect(() => {
      const theme = this._theme();
      console.log('ThemeService: Syncing theme to DOM:', theme);
      const html = document.documentElement;
      if (theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      localStorage.setItem('sf_theme', theme);
    });

    // Sync quarter to storage
    effect(() => {
      localStorage.setItem('sf_quarter', this._quarter());
    });
  }

  toggle() {
    console.log('ThemeService: Toggling theme from', this._theme());
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
    console.log('ThemeService: New theme is', this._theme());
  }

  setTheme(theme: Theme) {
    this._theme.set(theme);
  }

  setQuarter(q: string) {
    this._quarter.set(q);
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem('sf_theme') as Theme | null;
    if (stored) return stored;
    // Default: dark
    return 'dark';
  }

  private loadQuarter(): string {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    const current = `Q${q}-${now.getFullYear()}`;
    
    localStorage.setItem('sf_quarter', current);
    return current;
  }
}
