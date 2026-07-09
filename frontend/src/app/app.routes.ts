import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'sources', pathMatch: 'full' },
  {
    path: 'prototype/dashboard',
    loadComponent: () =>
      import('./features/dashboard/prototype/dashboard-prototype.component').then(
        (m) => m.DashboardPrototypeComponent,
      ),
  },
  {
    path: 'sources',
    loadComponent: () =>
      import('./features/sources/sources-list/sources-list.component').then(
        (m) => m.SourcesListComponent,
      ),
  },
  {
    path: 'sources/new',
    loadComponent: () =>
      import('./features/sources/source-form/source-form.component').then(
        (m) => m.SourceFormComponent,
      ),
  },
  {
    path: 'sources/:id/zones',
    loadComponent: () =>
      import('./features/sources/zone-editor/zone-editor.component').then(
        (m) => m.ZoneEditorComponent,
      ),
  },
  {
    path: 'live/:sessionId',
    loadComponent: () =>
      import('./features/live-feed/live-feed.component').then((m) => m.LiveFeedComponent),
  },
  {
    path: 'sessions/new',
    loadComponent: () =>
      import('./features/sessions/start-session/start-session.component').then(
        (m) => m.StartSessionComponent,
      ),
  },
];
