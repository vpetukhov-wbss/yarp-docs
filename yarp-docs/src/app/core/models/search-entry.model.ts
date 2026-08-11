import type { LocaleCode } from './locale.model';

export interface SearchIndexEntry {
  readonly slug: string;
  readonly locale: LocaleCode;
  readonly group: string;
  readonly title: string;
  // Set when this entry targets a sub-heading, e.g. "Load balancing › Round robin".
  readonly headingPath?: string;
  // Combined with slug for deep-linking a result, e.g. '#round-robin'.
  readonly anchor?: string;
  readonly excerpt: string;
  readonly keywords?: readonly string[];
}
