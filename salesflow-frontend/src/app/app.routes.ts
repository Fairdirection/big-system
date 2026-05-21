import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

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
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            m => m.LoginComponent
          ),
        title: 'fair direction — Login',
      },
      {
        path: 'change-password',
        canActivate: [guestGuard],
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
        path: 'commissions',
        loadComponent: () =>
          import('./features/commissions/commissions.component').then(
            m => m.CommissionsComponent
          ),
        title: 'العمولات والعلاوات',
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
