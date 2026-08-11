import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import { NavStore } from '../../../core/state/nav.store';
import { DocBody } from '../../../shared/components/doc-body/doc-body';
import { PrevNext } from '../../../shared/components/prev-next/prev-next';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { TranslationBanner } from '../../../shared/components/translation-banner/translation-banner';
import { PageToc } from '../../../shell/page-toc/page-toc';
import { SidebarNav } from '../../../shell/sidebar-nav/sidebar-nav';
import { DocArticleStore, type LoadDocArticleParams } from '../state/doc-article.store';

// A heading counts as "scrolled past" once its top edge clears the 56px
// sticky header (plus a little breathing room) - the decision rule for
// which heading is active (see updateActiveHeading below).
const HEADER_CLEARANCE_PX = 64;

@Component({
  selector: 'app-doc-article',
  imports: [RouterLink, DocBody, PrevNext, TranslationBanner, Skeleton, PageToc, SidebarNav],
  providers: [DocArticleStore],
  templateUrl: './doc-article.html',
  styleUrl: './doc-article.scss',
})
export class DocArticle {
  protected readonly store = inject(DocArticleStore);
  private readonly navStore = inject(NavStore);
  private readonly route = inject(ActivatedRoute);

  private readonly bodyEl = viewChild('bodyEl', { read: ElementRef });

  protected readonly activeHeadingId = signal<string | null>(null);

  // NavStore has no live consumer before Step 10 (SidebarNav) starts loading
  // it - until then this simply has no match and the middle breadcrumb
  // segment is omitted, not broken.
  protected readonly groupLabel = computed(() => {
    const page = this.store.page();
    if (!page) {
      return null;
    }
    return this.navStore.groups().find((group) => group.id === page.group)?.label ?? null;
  });

  private readonly routeParams = toSignal(
    this.route.paramMap.pipe(
      map((params): LoadDocArticleParams | null => {
        const locale = params.get('locale');
        const slug = params.get('slug');
        return locale && slug ? { locale: locale as LocaleCode, slug } : null;
      }),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const params = this.routeParams();
      if (params) {
        this.store.load(params);
      }
    });

    afterRenderEffect((onCleanup) => {
      const page = this.store.page();
      if (!page) {
        return;
      }

      // "Active" is always the last heading whose top has scrolled above
      // the header - the standard scrollspy rule, and it also gives the
      // correct default (the first heading) with no separate initial-state
      // case to maintain. Recomputed on a plain `scroll` listener, not an
      // IntersectionObserver watching a narrow band: a band can be
      // teleported over entirely by a single large, un-animated scroll
      // (scrollbar drag, Page Down, a `scrollIntoView` jump) without ever
      // registering as "intersecting" at a sampled instant, silently
      // freezing activeHeadingId - a scroll listener fires unconditionally
      // on any delta, however large, so it can't miss a heading this way.
      //
      // Both the container and the heading elements are re-queried fresh
      // on every tick rather than captured once outside the handler: this
      // component's host content can be re-rendered independently of this
      // effect re-running (observed directly - the same #id can end up on
      // a disconnected node within a few hundred ms of initial render), and
      // a detached element's getBoundingClientRect() silently returns all
      // zeros, which satisfies "<= HEADER_CLEARANCE_PX" for every heading
      // at once and made the *last* one win regardless of real scroll
      // position. Re-querying by id is immune to that regardless of cause.
      //
      // rAF-throttled with a ticking flag, not cancel-and-reschedule: a
      // cancel/reschedule debounce can still leave two rAF callbacks armed
      // across adjacent frames, and a stale one reading geometry after the
      // DOM changed underneath it was part of what produced the bogus
      // values above. The ticking flag guarantees at most one read is ever
      // in flight.
      let ticking = false;
      const updateActiveHeading = (): void => {
        if (ticking) {
          return;
        }
        ticking = true;
        requestAnimationFrame(() => {
          const container = this.bodyEl()?.nativeElement as HTMLElement | undefined;
          const elements = container
            ? page.headings
                .map((heading) => container.querySelector<HTMLElement>(`#${CSS.escape(heading.id)}`))
                .filter((element): element is HTMLElement => element !== null)
            : [];
          if (elements.length > 0) {
            const passed = elements.filter(
              (element) => element.getBoundingClientRect().top <= HEADER_CLEARANCE_PX,
            );
            this.activeHeadingId.set((passed.at(-1) ?? elements[0]).id);
          }
          ticking = false;
        });
      };

      updateActiveHeading();
      window.addEventListener('scroll', updateActiveHeading, { passive: true });
      onCleanup(() => {
        window.removeEventListener('scroll', updateActiveHeading);
      });
    });
  }

  protected retry(): void {
    const params = this.routeParams();
    if (params) {
      this.store.load(params);
    }
  }
}
