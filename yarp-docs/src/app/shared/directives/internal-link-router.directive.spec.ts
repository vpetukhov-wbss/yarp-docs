import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { InternalLinkRouterDirective } from './internal-link-router.directive';

@Component({
  selector: 'app-test-host',
  imports: [InternalLinkRouterDirective],
  template: `
    <div appInternalLinkRouter>
      <a href="/en/config-files">Internal</a>
      <a href="/en/config-files" target="_blank">Internal, new tab</a>
      <a href="https://learn.microsoft.com/x" target="_blank" rel="noopener">External</a>
    </div>
    <a href="/en/outside-the-directive">Outside</a>
  `,
})
class TestHostComponent {}

function clickLink(anchor: HTMLAnchorElement, init: Partial<MouseEventInit> = {}): void {
  anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }));
}

describe('InternalLinkRouterDirective', () => {
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  let fixture: ReturnType<typeof TestBed.createComponent<TestHostComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  function anchor(text: string): HTMLAnchorElement {
    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const found = Array.from(links).find((a) => a.textContent === text);
    if (!found) throw new Error(`No <a> with text "${text}"`);
    return found;
  }

  it('intercepts a plain click on a same-origin absolute-path link and routes it', () => {
    const link = anchor('Internal');
    clickLink(link);
    expect(navigateSpy).toHaveBeenCalledWith('/en/config-files');
  });

  it('prevents the default navigation so no full page reload happens', () => {
    const link = anchor('Internal');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['ctrlKey', { ctrlKey: true }],
    ['metaKey', { metaKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
  ])('does not intercept a click with %s held (browser default: open in new tab)', (_name, init) => {
    const link = anchor('Internal');
    clickLink(link, init);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not intercept a non-primary-button click', () => {
    const link = anchor('Internal');
    clickLink(link, { button: 1 });
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not intercept a target="_blank" link even to an internal path', () => {
    const link = anchor('Internal, new tab');
    clickLink(link);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not intercept an external link', () => {
    const link = anchor('External');
    clickLink(link);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('does not intercept a link outside the directive-hosted element', () => {
    const link = anchor('Outside');
    clickLink(link);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
