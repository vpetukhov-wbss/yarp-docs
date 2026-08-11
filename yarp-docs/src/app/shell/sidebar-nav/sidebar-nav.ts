import { Component, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import type { LocaleCode } from '../../core/models/locale.model';
import { MobileNavStore } from '../../core/state/mobile-nav.store';
import { NavStore } from '../../core/state/nav.store';

@Component({
  selector: 'app-sidebar-nav',
  imports: [RouterLink],
  templateUrl: './sidebar-nav.html',
  styleUrl: './sidebar-nav.scss',
})
export class SidebarNav {
  private readonly navStore = inject(NavStore);
  private readonly mobileNav = inject(MobileNavStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly groups = this.navStore.groups;
  protected readonly appendix = this.navStore.appendix;
  protected readonly isOpen = this.mobileNav.open;

  private readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale'))),
    { initialValue: null },
  );

  protected readonly currentSlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug'))),
    { initialValue: null },
  );

  protected readonly activeGroupId = computed(() => {
    const slug = this.currentSlug();
    if (!slug) {
      return null;
    }
    return this.groups().find((group) => group.items.some((item) => item.slug === slug))?.id ?? null;
  });

  constructor() {
    effect(() => {
      const locale = this.locale();
      if (locale) {
        this.navStore.load(locale as LocaleCode);
      }
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileNav.close());
  }

  protected closeDrawer(): void {
    this.mobileNav.close();
  }
}
