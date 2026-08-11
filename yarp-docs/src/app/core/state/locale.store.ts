import { effect } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

import { DEFAULT_LOCALE } from '../locales';
import type { LocaleCode } from '../models/locale.model';

interface LocaleState {
  current: LocaleCode;
}

// Deliberately minimal: current locale + a setter + syncing <html lang>,
// all safe to own unconditionally. Reading/validating a stored or
// browser-preferred locale and persisting a chosen one both require
// validating against SUPPORTED_LOCALES first, which is exactly what
// locale.guard.ts (Step 12) is for - that's where setLocale() actually gets
// called from, not here.
export const LocaleStore = signalStore(
  { providedIn: 'root' },
  withState<LocaleState>({ current: DEFAULT_LOCALE }),
  withMethods((store) => ({
    setLocale(code: LocaleCode): void {
      patchState(store, { current: code });
    },
  })),
  withHooks({
    onInit(store) {
      effect(() => {
        document.documentElement.lang = store.current();
      });
    },
  }),
);
