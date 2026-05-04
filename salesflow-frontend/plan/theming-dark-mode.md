# 📄 theming-dark-mode.md
# SalesFlow Frontend — Theming & Dark Mode

SalesFlow defaults to **dark mode** — the entire color palette is dark-first. The light mode is an opt-in override applied via a CSS class on the `<html>` element.

---

## 1. `ThemeService` — Angular Signals

```ts
// src/app/core/services/theme.service.ts
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

  constructor() {
    // Sync theme to DOM on every change
    effect(() => {
      const theme = this._theme();
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
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
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
    return localStorage.getItem('sf_quarter') || getQuarterId(new Date());
  }
}
```

---

## 2. Quarter Utility (mirrors backend `quarter.utils.js`)

```ts
// src/app/core/utils/quarter.utils.ts

/**
 * Returns quarter ID string — e.g. "Q2-2026"
 * Mirrors backend src/utils/quarter.utils.js getQuarterId()
 */
export function getQuarterId(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q}-${date.getFullYear()}`;
}

/**
 * Generates the past 4 quarters + current for the selector
 */
export function getAvailableQuarters(): string[] {
  const quarters: string[] = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
    quarters.push(getQuarterId(d));
  }
  return quarters;
}
```

---

## 3. Tailwind Dark Mode Variables

In `tailwind.config.js`, `darkMode: 'class'` is set. The dark color palette is the default; light mode overrides specific tokens.

Add to `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ── Dark mode (default) ── */
  :root {
    --color-bg:       210 11% 6%;     /* #0a0b0f */
    --color-surface:  220 14% 9%;     /* #12141a */
    --color-elevated: 224 20% 13%;    /* #1a1d27 */
    --color-border:   225 17% 18%;    /* #252836 */
    --color-text:     214 32% 91%;    /* #e2e8f0 */
    --color-muted:    215 16% 47%;    /* #64748b */
  }

  /* ── Light mode override ── */
  .light {
    --color-bg:       0 0% 97%;
    --color-surface:  0 0% 100%;
    --color-elevated: 220 14% 96%;
    --color-border:   220 13% 91%;
    --color-text:     222 47% 11%;
    --color-muted:    215 16% 47%;
  }

  html {
    @apply bg-sf-bg text-sf-text font-body antialiased;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
}
```

---

## 4. Theme Toggle Button (Standalone)

```ts
// src/app/shared/components/theme-toggle/theme-toggle.component.ts
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      class="relative w-12 h-6 rounded-pill transition-colors duration-300 focus:outline-none
             focus:ring-2 focus:ring-neon-purple/50"
      [class.bg-neon-purple]="theme.isDark()"
      [class.bg-sf-border]="!theme.isDark()">

      <!-- Thumb -->
      <span
        class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
               flex items-center justify-center transition-transform duration-300"
        [class.translate-x-6]="theme.isDark()">
        @if (theme.isDark()) {
          <!-- Moon -->
          <svg class="w-3 h-3 text-neon-purple" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
        } @else {
          <!-- Sun -->
          <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
          </svg>
        }
      </span>
    </button>
  `,
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
```

---

## 5. Initialize Theme on App Start

In `app.component.ts`, eagerly inject `ThemeService` so the effect fires before the first render:

```ts
// src/app/app.component.ts
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  // Eagerly inject to apply saved theme class to <html> before first render
  private theme = inject(ThemeService);
}
```

---

## Summary

| Concern | Implementation |
|---|---|
| Default mode | Dark — `'dark'` class on `<html>` at startup |
| Theme storage | `localStorage` key `sf_theme` |
| Toggle | Angular signal in `ThemeService.toggle()` |
| DOM sync | `effect()` adds/removes `.dark` class on `<html>` |
| Quarter state | Signal-based, persisted to `localStorage` key `sf_quarter` |
| CSS strategy | `tailwind darkMode: 'class'` — add `.dark` to `<html>` |
