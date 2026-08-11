import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { DocPage } from '../models/doc-page.model';
import type { LocaleCode, LocaleDescriptor } from '../models/locale.model';
import type { NavTree } from '../models/nav.model';
import type { SearchIndexEntry } from '../models/search-entry.model';

// The only thing any component or store talks to for content. Every method
// returns Observable<T> from a plain HttpClient call - nothing here knows or
// cares whether it's currently backed by static JSON fixtures or a real
// .NET Minimal API; that's entirely the concern of `environment.apiBaseUrl`
// and, in mock mode, the interceptor in ./mock-api.interceptor.ts.
//
// Locale is always a URL path segment, never a query string: static file
// serving (including this app's own mock fixtures) ignores query strings
// when resolving a file, so a query-param locale would silently always
// resolve to the same file. This is also just correct REST modeling - keep
// it that way on the future real API too, or the "swap the base URL" story
// breaks.
@Injectable({ providedIn: 'root' })
export class DocsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getLocales(): Observable<LocaleDescriptor[]> {
    return this.http.get<LocaleDescriptor[]>(`${this.baseUrl}/locales`);
  }

  getNavTree(locale: LocaleCode): Observable<NavTree> {
    return this.http.get<NavTree>(`${this.baseUrl}/nav/${locale}`);
  }

  getPage(locale: LocaleCode, slug: string): Observable<DocPage> {
    return this.http.get<DocPage>(`${this.baseUrl}/pages/${locale}/${slug}`);
  }

  getSearchIndex(locale: LocaleCode): Observable<SearchIndexEntry[]> {
    return this.http.get<SearchIndexEntry[]>(`${this.baseUrl}/search-index/${locale}`);
  }
}
