import { Routes } from '@angular/router';

export const CLAIM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./claim-list/claim-list.component').then(m => m.ClaimListComponent),
    title: 'Claims',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./claim-form/claim-form.component').then(m => m.ClaimFormComponent),
    title: 'Manage Claim',
  },
];
