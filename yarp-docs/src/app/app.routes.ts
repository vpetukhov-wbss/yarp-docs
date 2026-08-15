import type { Routes } from '@angular/router';

import { detectPreferredLocale, localeGuard } from './core/guards/locale.guard';
import { SearchStore } from './features/search/state/search.store';

export const routes: Routes = [
  // A RedirectFunction runs in an injection context, so this reuses the
  // exact same detection localeGuard falls back to for an unresolvable
  // :locale segment - "which locale do we pick when we have to guess" has
  // one implementation, not two that could drift apart.
  { path: '', redirectTo: () => detectPreferredLocale(), pathMatch: 'full' },
  {
    path: ':locale',
    canActivate: [localeGuard],
    // Route-scoped rather than root: SiteHeader (the trigger) and
    // SearchDialog (the overlay, always mounted in AppShell) are siblings,
    // not parent/child, so a common ancestor injector is needed either way -
    // this also means the index/query/results reset for free on a locale
    // switch instead of needing to be cleared by hand.
    providers: [SearchStore],
    loadComponent: () => import('./shell/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        data: { titleKey: 'home.heroEyebrow', descriptionKey: 'home.heroLede' },
        loadComponent: () => import('./features/home/pages/home').then((m) => m.Home),
      },
      {
        path: 'docs',
        data: { titleKey: 'docsIndex.title', descriptionKey: 'docsIndex.lede' },
        loadComponent: () =>
          import('./features/docs-index/pages/docs-index').then((m) => m.DocsIndex),
      },
      {
        // Registered after 'docs' so it doesn't swallow that path. No
        // titleKey - DocArticle's title is page content, set by its own
        // effect once the page has loaded (see AppTitleStrategy).
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
