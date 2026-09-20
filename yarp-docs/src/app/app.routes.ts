import type { Routes } from '@angular/router';

import { detectPreferredLocale, localeGuard } from './core/guards/locale.guard';
import { SearchStore } from './features/search/state/search.store';

export const routes: Routes = [
  { path: '', redirectTo: () => detectPreferredLocale(), pathMatch: 'full' },
  {
    path: ':locale',
    canActivate: [localeGuard],
    providers: [SearchStore],
    loadComponent: () => import('./shell/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        data: { titleKey: 'home.metaTitle', descriptionKey: 'home.heroLede' },
        loadComponent: () => import('./features/home/pages/home').then((m) => m.Home),
      },
      {
        path: 'projects',
        data: { titleKey: 'projects.metaTitle', descriptionKey: 'projects.lede' },
        loadComponent: () => import('./features/projects/pages/projects').then((m) => m.Projects),
      },
      {
        path: 'projects/:projectSlug',
        loadComponent: () =>
          import('./features/projects/pages/project-detail').then((m) => m.ProjectDetail),
      },
      {
        path: 'engineering',
        data: { titleKey: 'engineering.metaTitle', descriptionKey: 'engineering.lede' },
        loadComponent: () =>
          import('./features/engineering/pages/engineering').then((m) => m.Engineering),
      },
      {
        path: 'about',
        data: { titleKey: 'about.metaTitle', descriptionKey: 'about.lede' },
        loadComponent: () => import('./features/about/pages/about').then((m) => m.About),
      },
      {
        path: 'docs',
        data: { titleKey: 'docsIndex.title', descriptionKey: 'docsIndex.lede' },
        loadComponent: () =>
          import('./features/docs-index/pages/docs-index').then((m) => m.DocsIndex),
      },
      {
        // Keep legacy documentation URLs stable. Structured product routes above
        // must stay before this catch-all article route.
        path: ':slug',
        loadComponent: () =>
          import('./features/doc-article/pages/doc-article').then((m) => m.DocArticle),
      },
      {
        path: '**',
        data: { titleKey: 'notFound.title' },
        loadComponent: () => import('./features/not-found/pages/not-found').then((m) => m.NotFound),
      },
    ],
  },
  { path: '**', redirectTo: () => detectPreferredLocale() },
];
