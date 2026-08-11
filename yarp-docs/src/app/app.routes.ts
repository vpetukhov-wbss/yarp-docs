import type { Routes } from '@angular/router';

// LocaleGuard (validating the :locale segment, redirecting unresolvable ones,
// and detecting a real default from navigator.language) lands in Step 12.
// Until then 'en' is a fixed fallback so the app is navigable end to end.
const FALLBACK_LOCALE = 'en';

export const routes: Routes = [
  { path: '', redirectTo: FALLBACK_LOCALE, pathMatch: 'full' },
  {
    path: ':locale',
    loadComponent: () => import('./shell/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/pages/home').then((m) => m.Home),
      },
      {
        path: 'docs',
        loadComponent: () => import('./features/docs-index/pages/docs-index').then((m) => m.DocsIndex),
      },
      {
        // Registered after 'docs' so it doesn't swallow that path.
        path: ':slug',
        loadComponent: () => import('./features/doc-article/pages/doc-article').then((m) => m.DocArticle),
      },
      {
        path: '**',
        loadComponent: () => import('./features/not-found/pages/not-found').then((m) => m.NotFound),
      },
    ],
  },
  { path: '**', redirectTo: FALLBACK_LOCALE },
];
