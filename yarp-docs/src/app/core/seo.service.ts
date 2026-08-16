import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';

// Central place for the cross-cutting SEO tags every route needs
// (canonical, hreflang alternates, Open Graph, Twitter Card) - both
// AppTitleStrategy (static routes) and DocArticle (page-content routes)
// call into this instead of each hand-rolling document.head mutation, so
// the two never drift on tag shape or the canonical site origin.
const SITE_URL = 'https://yarp.dev';
const SITE_NAME = 'YARP Docs';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);

  // path: the full app-relative path including the locale segment, e.g.
  // "/en/yarp-overview" or "/bg" for that locale's home page.
  setCanonical(path: string): void {
    this.setSingletonLink('canonical', `${SITE_URL}${path}`);
  }

  // pathSuffix: the part of the path AFTER the :locale segment - "" for a
  // locale's home page, "/docs" for the docs index, "/yarp-overview" for a
  // doc page. Every locale shares the same pathSuffix by construction (see
  // app.routes.ts), which is what makes them true translations of the same
  // page rather than unrelated URLs.
  setHreflangAlternates(pathSuffix: string): void {
    this.clearHreflangLinks();
    for (const locale of SUPPORTED_LOCALES) {
      this.appendHreflangLink(locale.code, `${SITE_URL}/${locale.code}${pathSuffix}`);
    }
    this.appendHreflangLink('x-default', `${SITE_URL}/${DEFAULT_LOCALE}${pathSuffix}`);
  }

  setSocialTags(options: { title: string; description: string; path: string }): void {
    this.meta.updateTag({ property: 'og:title', content: options.title });
    this.meta.updateTag({ property: 'og:description', content: options.description });
    this.meta.updateTag({ property: 'og:url', content: `${SITE_URL}${options.path}` });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: options.title });
    this.meta.updateTag({ name: 'twitter:description', content: options.description });
  }

  private setSingletonLink(rel: string, href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private appendHreflangLink(hreflang: string, href: string): void {
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    link.setAttribute('data-seo-hreflang', '');
    this.document.head.appendChild(link);
  }

  // Re-set on every navigation (rather than diffed in place) since the set
  // of alternates never grows/shrinks, only their hrefs change - simpler
  // and cheap enough at 9 <link> elements.
  private clearHreflangLinks(): void {
    this.document.head.querySelectorAll('link[data-seo-hreflang]').forEach((el) => el.remove());
  }
}
