import { Routes } from '@angular/router';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./client-list/client-list.component').then(m => m.ClientListComponent),
    title: 'Clients',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./client-form/client-form.component').then(m => m.ClientFormComponent),
    title: 'New Client',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./client-form/client-form.component').then(m => m.ClientFormComponent),
    title: 'Edit Client',
  },
];
