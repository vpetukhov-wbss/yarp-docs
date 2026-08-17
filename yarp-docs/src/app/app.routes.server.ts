import type { ServerRoute } from '@angular/ssr';
import { RenderMode } from '@angular/ssr';

import { SUPPORTED_LOCALES } from './core/locales';
import { PRERENDER_SLUGS } from './core/prerender-slugs.generated';

// Every route this app serves is fully static (same content for every
// visitor, no user-specific data), so every one of them is prerenderable -
// see angular.json's outputMode: "static", which turns this into pure
// build-time SSG instead of a server that renders on every request.
// Order matters, same as app.routes.ts's own children: the literal
// ':locale/docs' path must be registered before the ':locale/:slug'
// wildcard, or the wildcard would swallow it.
export const serverRoutes: ServerRoute[] = [
  {
    path: ':locale',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return SUPPORTED_LOCALES.map((locale) => ({ locale: locale.code }));
    },
  },
  {
    path: ':locale/docs',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return SUPPORTED_LOCALES.map((locale) => ({ locale: locale.code }));
    },
  },
  {
    path: ':locale/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return SUPPORTED_LOCALES.flatMap((locale) =>
        PRERENDER_SLUGS.map((slug) => ({ locale: locale.code, slug })),
      );
    },
  },
  // The not-found catch-all has no finite param space to enumerate (the
  // wildcard matches any unmatched slug) and isn't a page worth indexing
  // anyway - left client-rendered, same as today, served by vercel.json's
  // SPA fallback rewrite for any path with no prerendered file.
  {
    path: ':locale/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
