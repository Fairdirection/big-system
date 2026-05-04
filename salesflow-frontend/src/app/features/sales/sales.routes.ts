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
    path: ':id/edit',
    loadComponent: () =>
      import('./sale-form/sale-form.component').then(m => m.SaleFormComponent),
    title: 'Edit Sale',
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
