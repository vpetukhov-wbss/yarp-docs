import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import MiniSearch from 'minisearch';
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import type { SearchIndexEntry } from '../../../core/models/search-entry.model';
import { DocsApiService } from '../../../core/services/docs-api';
import { cjkAwareTokenize } from '../utils/cjk-tokenizer';

type IndexStatus = 'idle' | 'loading' | 'success' | 'error';

const MAX_RESULTS = 20;
const SEARCH_DEBOUNCE_MS = 180;
const MIN_QUERY_LENGTH = 2;

interface IndexedDoc {
  readonly id: string;
  readonly title: string;
  readonly headingPath: string;
  readonly excerpt: string;
  readonly keywordsText: string;
}

interface SearchState {
  indexLocale: LocaleCode | null;
  indexStatus: IndexStatus;
  query: string;
  results: readonly SearchIndexEntry[];
  highlightedIndex: number;
}

const initialState: SearchState = {
  indexLocale: null,
  indexStatus: 'idle',
  query: '',
  results: [],
  highlightedIndex: 0,
};

// A slug alone isn't guaranteed unique within one locale's index - the model
// allows one entry per heading (`headingPath`/`anchor`) on top of one per
// page, so the id MiniSearch indexes under (and the key used to map a hit
// back to its full SearchIndexEntry) combines both.
function entryId(entry: SearchIndexEntry): string {
  return `${entry.slug}::${entry.anchor ?? ''}`;
}

function buildIndex(entries: readonly SearchIndexEntry[]): MiniSearch<IndexedDoc> {
  const miniSearch = new MiniSearch<IndexedDoc>({
    idField: 'id',
    fields: ['title', 'headingPath', 'excerpt', 'keywordsText'],
    storeFields: [],
    tokenize: cjkAwareTokenize,
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, headingPath: 2 },
    },
  });
  miniSearch.addAll(
    entries.map(
      (entry): IndexedDoc => ({
        id: entryId(entry),
        title: entry.title,
        headingPath: entry.headingPath ?? '',
        excerpt: entry.excerpt,
        keywordsText: (entry.keywords ?? []).join(' '),
      }),
    ),
  );
  return miniSearch;
}

// Route-scoped (provided on the ':locale' route, not root - see
// app.routes.ts) - a fresh instance per locale segment, so the index, query,
// and results all reset for free on a locale switch instead of needing to
// be cleared by hand.
export const SearchStore = signalStore(
  withState(initialState),
  withComputed(({ results, highlightedIndex }) => ({
    highlightedResult: computed<SearchIndexEntry | null>(() => results()[highlightedIndex()] ?? null),
  })),
  withMethods((store, docsApi = inject(DocsApiService)) => {
    // Neither the MiniSearch instance nor the id->entry lookup are reactive
    // UI state - they're query-engine internals, rebuilt whenever the index
    // reloads and read synchronously from `runSearch`, so they live as plain
    // closure variables rather than in `withState`.
    let miniSearch: MiniSearch<IndexedDoc> | null = null;
    let entriesById = new Map<string, SearchIndexEntry>();

    const runSearch = rxMethod<string>(
      pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((query) => {
          const trimmed = query.trim();
          if (trimmed.length < MIN_QUERY_LENGTH || !miniSearch) {
            patchState(store, { results: [], highlightedIndex: 0 });
            return;
          }
          const found = miniSearch
            .search(trimmed)
            .slice(0, MAX_RESULTS)
            .map((result) => entriesById.get(String(result.id)))
            .filter((entry): entry is SearchIndexEntry => entry !== undefined);
          patchState(store, { results: found, highlightedIndex: 0 });
        }),
      ),
    );

    return {
      // Callers decide whether a fetch is actually needed (checking
      // indexLocale/indexStatus first) - this always fetches when invoked,
      // same as every other store's `load` in this app.
      loadIndex: rxMethod<LocaleCode>(
        pipe(
          tap((locale) => patchState(store, { indexStatus: 'loading', indexLocale: locale, results: [] })),
          switchMap((locale) =>
            docsApi.getSearchIndex(locale).pipe(
              tapResponse({
                next: (entries) => {
                  entriesById = new Map(entries.map((entry) => [entryId(entry), entry]));
                  miniSearch = buildIndex(entries);
                  patchState(store, { indexStatus: 'success' });
                },
                error: () => patchState(store, { indexStatus: 'error' }),
              }),
            ),
          ),
        ),
      ),
      setQuery(query: string): void {
        patchState(store, { query });
        runSearch(query);
      },
      moveHighlight(delta: number): void {
        const count = store.results().length;
        if (count === 0) {
          return;
        }
        const next = (store.highlightedIndex() + delta + count) % count;
        patchState(store, { highlightedIndex: next });
      },
      reset(): void {
        patchState(store, { query: '', results: [], highlightedIndex: 0 });
      },
    };
  }),
);
