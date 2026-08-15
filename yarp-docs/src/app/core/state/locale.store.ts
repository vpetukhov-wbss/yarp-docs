import { effect } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../locales';
import type { LocaleCode } from '../models/locale.model';

interface LocaleState {
  current: LocaleCode;
}

// Deliberately minimal: current locale + a setter + syncing <html lang>/dir,
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
        const code = store.current();
        document.documentElement.lang = code;
        // Falls back to 'ltr' rather than throwing on a code somehow absent
        // from SUPPORTED_LOCALES - a wrong/stale <html dir> would silently
        // mirror the whole page, worse than assuming the common case.
        document.documentElement.dir =
          SUPPORTED_LOCALES.find((locale) => locale.code === code)?.dir ?? 'ltr';
      });
    },
  }),
);
