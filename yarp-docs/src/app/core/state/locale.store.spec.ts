import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LocaleStore } from './locale.store';

describe('LocaleStore', () => {
  let store: InstanceType<typeof LocaleStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), LocaleStore],
    });
    store = TestBed.inject(LocaleStore);
    TestBed.tick();
  });

  it('sets <html lang> and dir="ltr" for the default locale on init', () => {
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('updates <html lang> when the locale changes', () => {
    store.setLocale('bg');
    TestBed.tick();

    expect(document.documentElement.lang).toBe('bg');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('keeps dir="ltr" across every currently-supported locale (none are RTL yet)', () => {
    for (const code of ['ru', 'fr', 'el', 'es', 'de', 'pt-BR', 'zh-Hans'] as const) {
      store.setLocale(code);
      TestBed.tick();
      expect(document.documentElement.dir).toBe('ltr');
    }
  });
});
