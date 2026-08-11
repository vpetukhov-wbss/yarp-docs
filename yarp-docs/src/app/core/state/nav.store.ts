import type { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import type { LocaleCode } from '../models/locale.model';
import type { NavTree } from '../models/nav.model';
import { DocsApiService } from '../services/docs-api';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface NavState {
  tree: NavTree | null;
  status: Status;
}

const initialState: NavState = { tree: null, status: 'idle' };

// Shared by SidebarNav, Home, and DocsIndex - loaded once per locale, not
// once per consumer. `load` accepts either an imperative call
// (navStore.load('en')) or a reactive Signal<LocaleCode> source (rxMethod
// re-subscribes whenever the signal changes) - callers decide which locale
// source feeds it (the route directly for now; LocaleStore.current once
// Step 12's guard makes it the validated source of truth), so this store
// never needs to change when that wiring migrates.
export const NavStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ tree }) => ({
    groups: computed(() => tree()?.groups ?? []),
    appendix: computed(() => tree()?.appendix ?? []),
  })),
  withMethods((store, docsApi = inject(DocsApiService)) => ({
    load: rxMethod<LocaleCode>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap((locale) =>
          docsApi.getNavTree(locale).pipe(
            tapResponse({
              next: (tree) => patchState(store, { tree, status: 'success' }),
              error: (_error: HttpErrorResponse) => patchState(store, { status: 'error' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
