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
  {
    path: ':id/history/edit',
    loadComponent: () =>
      import('./employee-history-edit/employee-history-edit.component').then(m => m.EmployeeHistoryEditComponent),
    title: 'Manage Work History',
  },
];
