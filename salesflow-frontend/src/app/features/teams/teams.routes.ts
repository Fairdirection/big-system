import { Routes } from '@angular/router';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./team-list/team-list.component').then(m => m.TeamListComponent),
    title: 'Teams',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./team-form/team-form.component').then(m => m.TeamFormComponent),
    title: 'New Team',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./team-form/team-form.component').then(m => m.TeamFormComponent),
    title: 'Edit Team',
  },
];
