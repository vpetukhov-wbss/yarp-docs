import type { ServerRoute } from '@angular/ssr';
import { RenderMode } from '@angular/ssr';

import { SUPPORTED_LOCALES } from './core/locales';
import { PRERENDER_SLUGS } from './core/prerender-slugs.generated';
import { publicProjectCatalog } from './features/projects/data/public-project-catalog';

const localizedStaticPaths = ['projects', 'engineering', 'about', 'docs'] as const;

export const serverRoutes: ServerRoute[] = [
  {
    path: ':locale',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return SUPPORTED_LOCALES.map((locale) => ({ locale: locale.code }));
    },
  },
  ...localizedStaticPaths.map(
    (segment): ServerRoute => ({
      path: `:locale/${segment}`,
      renderMode: RenderMode.Prerender,
      async getPrerenderParams() {
        return SUPPORTED_LOCALES.map((locale) => ({ locale: locale.code }));
      },
    }),
  ),
  {
    path: ':locale/projects/:projectSlug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return SUPPORTED_LOCALES.flatMap((locale) =>
        publicProjectCatalog.map((project) => ({ locale: locale.code, projectSlug: project.slug })),
      );
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
  {
    path: ':locale/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
