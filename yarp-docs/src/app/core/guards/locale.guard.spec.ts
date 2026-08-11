import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { detectPreferredLocale, localeGuard } from './locale.guard';

const STORAGE_KEY = 'yarp-docs:locale';

function stubLanguages(languages: string[]): void {
  Object.defineProperty(navigator, 'languages', { value: languages, configurable: true });
}

function makeRoute(params: Record<string, string>): ActivatedRouteSnapshot {
  return { paramMap: convertToParamMap(params) } as unknown as ActivatedRouteSnapshot;
}

function makeState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('detectPreferredLocale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prefers a valid stored locale over navigator.languages', () => {
    localStorage.setItem(STORAGE_KEY, 'bg');
    stubLanguages(['en-US', 'en']);
    expect(detectPreferredLocale()).toBe('bg');
  });

  it('ignores an invalid stored locale and falls back to navigator.languages', () => {
    localStorage.setItem(STORAGE_KEY, 'xx');
    stubLanguages(['de-DE', 'de']);
    expect(detectPreferredLocale()).toBe('de');
  });

  it('matches a base language against a supported regional variant', () => {
    // Only pt-BR is supported, not pt-PT - the base "pt" should still match.
    stubLanguages(['pt-PT']);
    expect(detectPreferredLocale()).toBe('pt-BR');
  });

  it('falls back to the default locale when nothing matches', () => {
    stubLanguages(['ja-JP']);
    expect(detectPreferredLocale()).toBe('en');
  });
});

describe('localeGuard', () => {
  let router: Router;
  let usedWith: string | undefined;
  const translateStub = { use: (code: string) => (usedWith = code) };

  beforeEach(() => {
    localStorage.clear();
    usedWith = undefined;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateStub },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('accepts a valid locale, persists it, and switches the translate service', () => {
    const result = TestBed.runInInjectionContext(() =>
      localeGuard(makeRoute({ locale: 'de' }), makeState('/de/load-balancing')),
    );

    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('de');
    expect(usedWith).toBe('de');
  });

  it('redirects an unresolvable locale segment to a best-match locale, preserving the rest of the path', () => {
    localStorage.setItem(STORAGE_KEY, 'fr');

    const result = TestBed.runInInjectionContext(() =>
      localeGuard(makeRoute({ locale: 'xx' }), makeState('/xx/load-balancing')),
    );

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/fr/load-balancing');
  });

  it('redirects a missing locale segment the same way as an invalid one', () => {
    // A bare '/' is handled by app.routes.ts's own root redirect before
    // localeGuard is ever reached in real navigation - this exercises the
    // guard's own fallback in isolation, so the path still has a (bogus)
    // first segment for the replace regex to strip, same as any real
    // :locale activation would.
    stubLanguages(['de-DE']);

    const result = TestBed.runInInjectionContext(() => localeGuard(makeRoute({}), makeState('/somepath')));

    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/de');
  });
});
