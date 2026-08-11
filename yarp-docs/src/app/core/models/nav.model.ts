import type { LocaleCode } from './locale.model';

export interface NavItem {
  readonly slug: string;
  readonly title: string;
  readonly order: number;
  readonly kind: 'doc' | 'appendix';
}

export interface NavGroup {
  readonly id: string;
  readonly label: string;
  readonly order: number;
  readonly items: readonly NavItem[];
}

export interface NavTree {
  readonly locale: LocaleCode;
  readonly groups: readonly NavGroup[];
  // Kept out of `groups` deliberately - the appendix page
  // (aspnetcore-getting-started) isn't one of the 11 canonical sections.
  readonly appendix: readonly NavItem[];
}
