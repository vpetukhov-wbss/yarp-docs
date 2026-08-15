import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AppTitleStrategy } from './title-strategy';

function makeSnapshot(leafData: Record<string, unknown>): RouterStateSnapshot {
  const leaf = { data: leafData, firstChild: null } as unknown as ActivatedRouteSnapshot;
  const root = { data: {}, firstChild: leaf } as unknown as ActivatedRouteSnapshot;
  return { root } as unknown as RouterStateSnapshot;
}

// Mirrors a real catalog closely enough to exercise the {{title}}
// interpolation without pulling in the real i18n JSON.
const CATALOG: Record<string, string> = {
  'home.heroEyebrow': 'YARP Documentation',
  'home.heroLede': 'A highly customizable reverse proxy library.',
  'meta.titleTemplate': '{{title}} · YARP Docs',
};

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let setTitleSpy: ReturnType<typeof vi.spyOn>;
  let updateTagSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const translateStub = {
      get: (key: string | string[], params?: Record<string, string>) => {
        const template = CATALOG[key as string] ?? (key as string);
        const value = params ? template.replace('{{title}}', params['title'] ?? '') : template;
        return of(value);
      },
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AppTitleStrategy,
        { provide: TranslateService, useValue: translateStub },
      ],
    });

    strategy = TestBed.inject(AppTitleStrategy);
    setTitleSpy = vi.spyOn(TestBed.inject(Title), 'setTitle');
    updateTagSpy = vi.spyOn(TestBed.inject(Meta), 'updateTag');
  });

  it('sets the document title from titleKey, interpolated into meta.titleTemplate', () => {
    strategy.updateTitle(makeSnapshot({ titleKey: 'home.heroEyebrow' }));
    expect(setTitleSpy).toHaveBeenCalledWith('YARP Documentation · YARP Docs');
  });

  it('also sets a meta description when descriptionKey is present', () => {
    strategy.updateTitle(makeSnapshot({ titleKey: 'home.heroEyebrow', descriptionKey: 'home.heroLede' }));
    expect(updateTagSpy).toHaveBeenCalledWith({
      name: 'description',
      content: 'A highly customizable reverse proxy library.',
    });
  });

  it('does nothing when the deepest route has no titleKey (DocArticle: title is page content, not a route constant)', () => {
    strategy.updateTitle(makeSnapshot({}));
    expect(setTitleSpy).not.toHaveBeenCalled();
    expect(updateTagSpy).not.toHaveBeenCalled();
  });

  it('sets the title but skips the description when descriptionKey is absent', () => {
    strategy.updateTitle(makeSnapshot({ titleKey: 'home.heroEyebrow' }));
    expect(setTitleSpy).toHaveBeenCalled();
    expect(updateTagSpy).not.toHaveBeenCalled();
  });

  it('walks to the deepest leaf route rather than the root', () => {
    const leaf = { data: { titleKey: 'home.heroEyebrow' }, firstChild: null } as unknown as ActivatedRouteSnapshot;
    const middle = { data: { titleKey: 'wrong-should-not-be-used' }, firstChild: leaf } as unknown as ActivatedRouteSnapshot;
    const root = { data: {}, firstChild: middle } as unknown as ActivatedRouteSnapshot;

    strategy.updateTitle({ root } as unknown as RouterStateSnapshot);

    expect(setTitleSpy).toHaveBeenCalledWith('YARP Documentation · YARP Docs');
  });
});
