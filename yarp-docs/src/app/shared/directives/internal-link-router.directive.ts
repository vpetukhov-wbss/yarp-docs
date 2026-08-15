import { Directive, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';

// Intercepts clicks on same-origin, absolute-path <a href="/..."> links
// inside raw [innerHTML] content - the content compiler's `doc:` cross-link
// scheme and "See also" section both emit these - and routes them through
// the Angular Router instead of a full page reload/document request.
// Content that arrived as raw server HTML can't carry Angular (click)
// bindings of its own, the same reason CodeBlockEnhancerDirective exists.
//
// Event delegation on the host element (one listener, not one per link) -
// unlike CodeBlockEnhancerDirective's per-button listeners, this doesn't
// need to re-scan after every content swap: a single delegated listener on
// the host keeps working regardless of how many times its innerHTML
// content is replaced underneath it.
@Directive({
  selector: '[appInternalLinkRouter]',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class InternalLinkRouterDirective {
  private readonly router = inject(Router);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onClick(event: MouseEvent): void {
    // Respects modifier keys and a non-primary button the same way a real
    // <a routerLink> would (browser default: open in new tab/window) -
    // only a plain left click gets intercepted.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor || !this.elementRef.nativeElement.contains(anchor)) {
      return;
    }
    if (anchor.target && anchor.target !== '_self') {
      return; // target="_blank" (external links) - let the browser handle it
    }
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/')) {
      return; // not a same-origin absolute-path link
    }
    event.preventDefault();
    void this.router.navigateByUrl(href);
  }
}
