# 📄 ui-components.md
# SalesFlow Frontend — UI Component Library

All components are standalone, use `ChangeDetectionStrategy.OnPush`, and Tailwind CSS exclusively.

---

## 1. Navbar (Glassmorphism)

```html
<!-- src/app/shared/components/navbar/navbar.component.html -->
<nav class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6
            bg-sf-bg/70 backdrop-blur-lg border-b border-sf-border
            transition-all duration-300">

  <!-- Logo -->
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center
                shadow-glow-purple">
      <span class="text-white font-display font-bold text-sm">SF</span>
    </div>
    <span class="font-display font-semibold text-sf-text text-lg tracking-tight">
      SalesFlow
    </span>
  </div>

  <!-- Quarter Selector -->
  <div class="ml-8 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-pill
              bg-sf-surface border border-sf-border">
    <span class="text-sf-muted text-xs font-mono">Quarter</span>
    <select class="bg-transparent text-neon-cyan text-xs font-mono font-medium
                   outline-none cursor-pointer"
            [value]="currentQuarter()"
            (change)="onQuarterChange($event)">
      @for (q of availableQuarters(); track q) {
        <option [value]="q" class="bg-sf-surface text-sf-text">{{ q }}</option>
      }
    </select>
  </div>

  <div class="flex-1"></div>

  <!-- Actions -->
  <div class="flex items-center gap-4">
    <button (click)="toggleTheme()"
            class="p-2 rounded-lg text-sf-muted hover:text-sf-text hover:bg-sf-elevated
                   transition-colors duration-200">
      @if (isDark()) {
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      } @else {
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      }
    </button>

    <!-- User Avatar -->
    <button class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl
                   bg-sf-surface border border-sf-border hover:border-neon-purple/40
                   transition-all duration-200 group">
      <div class="w-6 h-6 rounded-full bg-gradient-purple flex items-center justify-center">
        <span class="text-white text-2xs font-bold">
          {{ currentUser()?.name?.charAt(0).toUpperCase() }}
        </span>
      </div>
      <span class="text-sf-text text-sm font-medium hidden sm:block">
        {{ currentUser()?.name }}
      </span>
    </button>
  </div>
</nav>
```

```ts
// src/app/shared/components/navbar/navbar.component.ts
import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private theme = inject(ThemeService);

  currentUser = this.auth.currentUser;
  isDark = this.theme.isDark;
  currentQuarter = this.theme.currentQuarter;
  availableQuarters = this.theme.availableQuarters;

  toggleTheme() { this.theme.toggle(); }
  onQuarterChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    this.theme.setQuarter(val);
  }
}
```

---

## 2. Sidebar

```html
<!-- src/app/shared/components/sidebar/sidebar.component.html -->
<aside [class.w-64]="expanded()" [class.w-16]="!expanded()"
       class="fixed left-0 top-16 bottom-0 z-40 flex flex-col
              bg-sf-surface border-r border-sf-border
              transition-all duration-300 ease-in-out overflow-hidden">

  <!-- Nav Items -->
  <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    @for (item of navItems; track item.path) {
      <a [routerLink]="item.path" routerLinkActive="active-nav-item"
         class="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sf-muted hover:text-sf-text hover:bg-sf-elevated
                transition-all duration-200 cursor-pointer">
        <div class="w-5 h-5 flex-shrink-0 transition-transform duration-200
                    group-hover:scale-110">
          <ng-icon [name]="item.icon" class="w-full h-full" />
        </div>
        @if (expanded()) {
          <span class="text-sm font-medium font-body whitespace-nowrap animate-fade-in">
            {{ item.label }}
          </span>
        }
      </a>
    }
  </nav>

  <!-- Toggle Button -->
  <button (click)="toggle()"
          class="m-3 p-2.5 rounded-xl bg-sf-elevated hover:bg-sf-border
                 text-sf-muted hover:text-sf-text transition-all duration-200
                 flex items-center justify-center">
    <svg [class.rotate-180]="expanded()"
         class="w-4 h-4 transition-transform duration-300"
         fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5l7 7-7 7" />
    </svg>
  </button>
</aside>

<style>
  .active-nav-item {
    @apply text-neon-purple bg-neon-purple/10 border border-neon-purple/20;
  }
</style>
```

```ts
// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroSquares2x2,
  heroUsers,
  heroBriefcase,
  heroCurrencyDollar,
  heroDocumentText,
  heroUserGroup,
  heroCog6Tooth,
  heroChartBar,
} from '@ng-icons/heroicons/outline';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIconComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({
    heroSquares2x2, heroUsers, heroBriefcase,
    heroCurrencyDollar, heroDocumentText,
    heroUserGroup, heroCog6Tooth, heroChartBar,
  })],
})
export class SidebarComponent {
  expanded = signal(true);

  navItems: NavItem[] = [
    { path: '/dashboard',  label: 'Dashboard',  icon: 'heroSquares2x2' },
    { path: '/employees',  label: 'Employees',  icon: 'heroUsers' },
    { path: '/teams',      label: 'Teams',      icon: 'heroUserGroup' },
    { path: '/clients',    label: 'Clients',    icon: 'heroBriefcase' },
    { path: '/sales',      label: 'Sales',      icon: 'heroCurrencyDollar' },
    { path: '/claims',     label: 'Claims',     icon: 'heroDocumentText' },
    { path: '/targets',    label: 'Targets',    icon: 'heroChartBar' },
    { path: '/settings',   label: 'Settings',   icon: 'heroCog6Tooth' },
  ];

  toggle() { this.expanded.update(v => !v); }
}
```

---

## 3. Buttons (Variants)

```ts
// src/app/shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)"
      [class]="buttonClasses">
      @if (loading) {
        <svg class="animate-spin w-4 h-4 flex-shrink-0"
             fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-medium font-body rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none';
    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-7',
      md: 'text-sm px-4 py-2 h-9',
      lg: 'text-sm px-6 py-2.5 h-11',
    };
    const variants = {
      primary:   'bg-gradient-purple text-white shadow-glow-purple hover:shadow-glow-purple hover:brightness-110 active:scale-95',
      secondary: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 hover:shadow-glow-cyan active:scale-95',
      danger:    'bg-neon-pink/10 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/20 hover:shadow-glow-pink active:scale-95',
      ghost:     'text-sf-muted hover:text-sf-text hover:bg-sf-elevated active:scale-95',
      outline:   'border border-sf-border text-sf-text hover:border-neon-purple/40 hover:bg-sf-elevated active:scale-95',
    };
    return `${base} ${sizes[this.size]} ${variants[this.variant]}`;
  }
}
```

---

## 4. Stat Card (Dashboard)

```ts
// src/app/shared/components/stat-card/stat-card.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';

export type StatVariant = 'purple' | 'cyan' | 'pink' | 'green';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CurrencyEgpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClasses" class="glass-card glass-card-hover p-5 animate-fade-in">
      <div class="flex items-start justify-between mb-4">
        <div [class]="iconWrapClasses"
             class="w-10 h-10 rounded-xl flex items-center justify-center">
          <ng-content select="[slot=icon]" />
        </div>
        @if (badge) {
          <span class="text-2xs font-mono px-2 py-0.5 rounded-pill"
                [class]="badgeClasses">
            {{ badge }}
          </span>
        }
      </div>

      <div>
        <p class="text-sf-muted text-xs font-body mb-1">{{ label }}</p>
        <p [class]="valueClasses" class="font-display font-bold text-2xl leading-none">
          @if (isCurrency) {
            {{ value | currencyEgp }}
          } @else {
            {{ value }}
          }
        </p>
        @if (subValue) {
          <p class="text-sf-muted text-xs mt-1.5">{{ subValue }}</p>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() subValue?: string;
  @Input() badge?: string;
  @Input() variant: StatVariant = 'purple';
  @Input() isCurrency = false;

  get cardClasses() {
    const borders = {
      purple: 'border-neon-purple/20',
      cyan:   'border-neon-cyan/20',
      pink:   'border-neon-pink/20',
      green:  'border-neon-green/20',
    };
    return borders[this.variant];
  }
  get iconWrapClasses() {
    return {
      purple: 'bg-neon-purple/15 text-neon-purple',
      cyan:   'bg-neon-cyan/15 text-neon-cyan',
      pink:   'bg-neon-pink/15 text-neon-pink',
      green:  'bg-neon-green/15 text-neon-green',
    }[this.variant];
  }
  get valueClasses() {
    return {
      purple: 'text-gradient-purple',
      cyan:   'text-gradient-cyan',
      pink:   'text-gradient-pink',
      green:  'text-sf-text',
    }[this.variant];
  }
  get badgeClasses() {
    return {
      purple: 'bg-neon-purple/10 text-neon-purple',
      cyan:   'bg-neon-cyan/10 text-neon-cyan',
      pink:   'bg-neon-pink/10 text-neon-pink',
      green:  'bg-neon-green/10 text-neon-green',
    }[this.variant];
  }
}
```

---

## 5. Input Component

```ts
// src/app/shared/components/input/input.component.ts
import { Component, Input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputComponent),
    multi: true,
  }],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label) {
        <label class="text-xs font-medium text-sf-muted font-body">
          {{ label }}
          @if (required) { <span class="text-neon-pink ml-0.5">*</span> }
        </label>
      }

      <div class="relative">
        @if (prefixIcon) {
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted pointer-events-none">
            <ng-content select="[slot=prefix]" />
          </div>
        }

        <input
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="isDisabled"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
          [class.pl-9]="prefixIcon"
          [class.border-neon-pink]="hasError"
          [class.border-neon-purple/50]="isFocused && !hasError"
          [class.shadow-inner-purple]="isFocused && !hasError"
          (focus)="isFocused = true"
          (blur)="isFocused = false"
          class="w-full h-9 px-3 rounded-xl text-sm font-body
                 bg-sf-elevated border border-sf-border
                 text-sf-text placeholder:text-sf-muted
                 outline-none transition-all duration-200
                 disabled:opacity-40 disabled:cursor-not-allowed" />
      </div>

      @if (hint && !hasError) {
        <p class="text-2xs text-sf-muted">{{ hint }}</p>
      }
      @if (hasError && errorMessage) {
        <p class="text-2xs text-neon-pink flex items-center gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ errorMessage }}
        </p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() prefixIcon = false;

  value = '';
  isDisabled = false;
  isFocused = false;

  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string) { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled = d; }

  onInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.onChange(this.value);
  }
}
```

---

## 6. Badge (Sale Status)

```ts
// src/app/shared/components/badge/badge.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type SaleStatus = 'draft' | 'confirmed' | 'claimed' | 'collected';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses"
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill
                 text-2xs font-medium font-mono uppercase tracking-wide">
      <span [class]="dotClasses" class="w-1.5 h-1.5 rounded-full"></span>
      {{ status }}
    </span>
  `,
})
export class BadgeComponent {
  @Input() status: SaleStatus = 'draft';

  get badgeClasses() {
    return {
      draft:     'bg-status-draft/15 text-status-draft',
      confirmed: 'bg-status-confirmed/15 text-status-confirmed',
      claimed:   'bg-status-claimed/15 text-status-claimed',
      collected: 'bg-status-collected/15 text-status-collected',
    }[this.status];
  }
  get dotClasses() {
    return {
      draft:     'bg-status-draft',
      confirmed: 'bg-status-confirmed',
      claimed:   'bg-status-claimed',
      collected: 'bg-status-collected',
    }[this.status];
  }
}
```

---

## 7. `CurrencyEgpPipe`

```ts
// src/app/shared/pipes/currency-egp.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyEgp', standalone: true, pure: true })
export class CurrencyEgpPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
```
