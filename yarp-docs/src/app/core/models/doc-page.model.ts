import type { LocaleCode } from './locale.model';

export interface DocHeading {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

export interface DocPageLink {
  readonly slug: string;
  readonly title: string;
}

export interface DocPage {
  readonly slug: string;
  readonly locale: LocaleCode;
  readonly group: string;
  readonly kind: 'doc' | 'appendix';
  readonly title: string;
  readonly lede: string;
  // Precomputed server-side for the right-rail TOC, not derived client-side.
  readonly headings: readonly DocHeading[];
  // Sanitized, pre-rendered HTML (incl. tok-* code spans) - bound via [innerHTML].
  readonly bodyHtml: string;
  readonly sourceUrl: string;
  readonly lastUpdated: string;
  // false => TranslationBanner renders; bodyHtml is an English copy, not a
  // second fetch - every (locale, slug) always resolves to a full DocPage.
  readonly translated: boolean;
  readonly prev: DocPageLink | null;
  readonly next: DocPageLink | null;
}
