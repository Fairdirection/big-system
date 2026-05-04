# 📄 routing-and-features.md
# SalesFlow Frontend — Routing & Feature Architecture

---

## `app.routes.ts` — Root Route Configuration

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  // ── Auth Layout ──────────────────────────────────────
  {
    path: 'auth',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(
        m => m.AuthLayoutComponent
      ),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            m => m.LoginComponent
          ),
        title: 'SalesFlow — Login',
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./features/auth/change-password/change-password.component').then(
            m => m.ChangePasswordComponent
          ),
        title: 'Change Password',
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ── Main App Layout (protected) ──────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        m => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
        title: 'Dashboard',
      },
      {
        path: 'employees',
        loadChildren: () =>
          import('./features/employees/employees.routes').then(
            m => m.EMPLOYEE_ROUTES
          ),
        title: 'Employees',
      },
      {
        path: 'teams',
        loadChildren: () =>
          import('./features/teams/teams.routes').then(m => m.TEAM_ROUTES),
        title: 'Teams',
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./features/clients/clients.routes').then(m => m.CLIENT_ROUTES),
        title: 'Clients',
      },
      {
        path: 'sales',
        loadChildren: () =>
          import('./features/sales/sales.routes').then(m => m.SALE_ROUTES),
        title: 'Sales',
      },
      {
        path: 'claims',
        loadChildren: () =>
          import('./features/claims/claims.routes').then(m => m.CLAIM_ROUTES),
        title: 'Claims',
      },
      {
        path: 'targets',
        loadComponent: () =>
          import('./features/targets/target-list/target-list.component').then(
            m => m.TargetListComponent
          ),
        title: 'Targets',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            m => m.SettingsComponent
          ),
        title: 'Settings',
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' },
];
```

---

## Feature Route Files

### Employees

```ts
// src/app/features/employees/employees.routes.ts
import { Routes } from '@angular/router';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./employee-list/employee-list.component').then(m => m.EmployeeListComponent),
    title: 'Employees',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    title: 'New Employee',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
    title: 'Employee Detail',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    title: 'Edit Employee',
  },
];
```

### Sales (with nested commission preview)

```ts
// src/app/features/sales/sales.routes.ts
import { Routes } from '@angular/router';

export const SALE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sale-list/sale-list.component').then(m => m.SaleListComponent),
    title: 'Sales',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./sale-form/sale-form.component').then(m => m.SaleFormComponent),
    title: 'New Sale',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./sale-detail/sale-detail.component').then(m => m.SaleDetailComponent),
    title: 'Sale Detail',
  },
  {
    path: ':id/commission',
    loadComponent: () =>
      import('./commission-preview/commission-preview.component').then(
        m => m.CommissionPreviewComponent
      ),
    title: 'Commission Preview',
  },
];
```

---

## Main Layout Component

```ts
// src/app/layout/main-layout/main-layout.component.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg bg-grid-pattern">
      <!-- Fixed Navbar -->
      <app-navbar />

      <div class="flex pt-16">
        <!-- Fixed Sidebar -->
        <app-sidebar />

        <!-- Main Content — offset by sidebar width -->
        <main
          class="flex-1 min-h-[calc(100vh-4rem)] p-6 transition-all duration-300"
          [class.ml-64]="sidebarExpanded()"
          [class.ml-16]="!sidebarExpanded()">
          <div class="max-w-7xl mx-auto animate-fade-in">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  private theme = inject(ThemeService);
  // In a real app, share sidebar state via a LayoutService signal
  sidebarExpanded = signal(true);
}
```

---

## Auth Layout Component

```ts
// src/app/layout/auth-layout/auth-layout.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg bg-grid-pattern flex items-center justify-center p-4">
      <!-- Ambient glow -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96
                    bg-neon-purple/10 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-1/4 right-1/4 w-64 h-64
                    bg-neon-cyan/8 rounded-full blur-[80px]"></div>
      </div>

      <div class="relative w-full max-w-sm animate-fade-in">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-2xl bg-gradient-purple shadow-glow-purple
                      flex items-center justify-center mx-auto mb-3">
            <span class="text-white font-display font-bold text-xl">SF</span>
          </div>
          <h1 class="font-display font-bold text-2xl text-gradient-purple">SalesFlow</h1>
          <p class="text-sf-muted text-sm mt-1">Commission Management System</p>
        </div>

        <router-outlet />
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
```

---

## Login Component

```ts
// src/app/features/auth/login/login.component.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-6 border border-sf-border">
      <h2 class="font-display font-semibold text-lg text-sf-text mb-6">Sign in</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <app-input
          label="Email"
          type="email"
          placeholder="admin@salesflow.com"
          formControlName="email"
          [hasError]="emailInvalid"
          [errorMessage]="'Enter a valid email address'"
          [required]="true" />

        <app-input
          label="Password"
          type="password"
          placeholder="••••••••"
          formControlName="password"
          [hasError]="passwordInvalid"
          [errorMessage]="'Password is required'"
          [required]="true" />

        @if (errorMsg()) {
          <div class="px-3 py-2.5 rounded-xl bg-neon-pink/10 border border-neon-pink/20
                      text-neon-pink text-sm flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"/>
            </svg>
            {{ errorMsg() }}
          </div>
        }

        <app-button
          type="submit"
          variant="primary"
          size="lg"
          [loading]="loading()"
          [disabled]="form.invalid"
          class="w-full">
          Sign in
        </app-button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  errorMsg = signal('');

  get emailInvalid() {
    const c = this.form.get('email');
    return !!(c?.invalid && c?.touched);
  }
  get passwordInvalid() {
    const c = this.form.get('password');
    return !!(c?.invalid && c?.touched);
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Invalid credentials');
        this.loading.set(false);
      },
    });
  }
}
```
