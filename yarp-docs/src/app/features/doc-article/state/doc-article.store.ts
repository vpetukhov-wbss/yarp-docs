import type { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import type { DocPage } from '../../../core/models/doc-page.model';
import { DocsApiService } from '../../../core/services/docs-api';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface DocArticleState {
  page: DocPage | null;
  status: Status;
  errorStatus: number | null;
}

const initialState: DocArticleState = { page: null, status: 'idle', errorStatus: null };

export interface LoadDocArticleParams {
  readonly locale: LocaleCode;
  readonly slug: string;
}

// Route-scoped (provided on the ':slug' route, not root) - a fresh instance
// per navigation to a different slug, so state can't leak between pages.
export const DocArticleStore = signalStore(
  withState(initialState),
  withComputed(({ page, status, errorStatus }) => ({
    translated: computed(() => page()?.translated ?? true),
    isAppendix: computed(() => page()?.kind === 'appendix'),
    // Two distinct failure states, per the plan: an unknown slug (404) still
    // renders inside valid-locale chrome with "not found" content, while any
    // other failure (network/5xx) renders a retry card - chrome stays intact
    // either way, only the content area differs.
    isNotFound: computed(() => status() === 'error' && errorStatus() === 404),
    hasLoadError: computed(() => status() === 'error' && errorStatus() !== 404),
  })),
  withMethods((store, docsApi = inject(DocsApiService)) => ({
    load: rxMethod<LoadDocArticleParams>(
      pipe(
        // `page` is cleared on every load, not just failures: an invariant
        // of "page is non-null iff status is 'success'" means every
        // consumer (the breadcrumb's group lookup, PageToc's headings, etc.)
        // can read store.page() without separately checking status() first.
        // Without this, a failed reload after a successful one left stale
        // content (a page title, a breadcrumb) rendered next to a 404 card
        // for a completely different page - a real bug caught in testing.
        tap(() => patchState(store, { page: null, status: 'loading', errorStatus: null })),
        switchMap(({ locale, slug }) =>
          docsApi.getPage(locale, slug).pipe(
            tapResponse({
              next: (page) => patchState(store, { page, status: 'success' }),
              error: (error: HttpErrorResponse) =>
                patchState(store, { page: null, status: 'error', errorStatus: error.status }),
            }),
          ),
        ),
      ),
    ),
  })),
);
