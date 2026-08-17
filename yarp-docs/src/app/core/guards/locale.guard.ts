import type { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from '../locales';
import type { LocaleCode } from '../models/locale.model';
import { LocaleStore } from '../state/locale.store';

const STORAGE_KEY = 'yarp-docs:locale';

// Shared by both the root '' redirect (app.routes.ts) and this guard's
// fallback path for an unresolvable :locale segment, so "which locale do we
// pick when we have to guess" has exactly one implementation. typeof-checked
// (not isPlatformBrowser/inject) so this keeps working when called directly,
// outside an injection context (as the spec does) - localStorage/navigator
// don't exist server-side (SSR/prerendering) either way, where DEFAULT_LOCALE
// is the only sensible answer anyway (there's no request-specific browser to
// read).
export function detectPreferredLocale(): LocaleCode {
  if (typeof localStorage === 'undefined' || typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isSupportedLocale(stored)) {
    return stored;
  }
  for (const lang of navigator.languages ?? [navigator.language]) {
    const exact = SUPPORTED_LOCALES.find((locale) => locale.code.toLowerCase() === lang.toLowerCase());
    if (exact) {
      return exact.code;
    }
    const base = lang.split('-')[0]?.toLowerCase();
    const baseMatch = SUPPORTED_LOCALES.find((locale) => locale.code.split('-')[0]?.toLowerCase() === base);
    if (baseMatch) {
      return baseMatch.code;
    }
  }
  return DEFAULT_LOCALE;
}

// Validates the :locale route segment. A valid segment persists (so the
// choice survives a reload) and switches TranslateService; an unresolvable
// one redirects to a best-match locale with the rest of the path preserved
// (e.g. /xx/load-balancing -> /en/load-balancing), not just bounced to the
// site root - a stale bookmark or a typo'd locale shouldn't lose the page
// the user was actually trying to reach.
export const localeGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const translate = inject(TranslateService);
  const localeStore = inject(LocaleStore);

  const requested = route.paramMap.get('locale');

  if (requested && isSupportedLocale(requested)) {
    localeStore.setLocale(requested);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, requested);
    }
    translate.use(requested);
    return true;
  }

  const resolved = detectPreferredLocale();
  const restOfPath = state.url.replace(/^\/[^/]+/, '');
  return router.parseUrl(`/${resolved}${restOfPath}`);
};
