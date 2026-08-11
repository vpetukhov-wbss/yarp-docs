import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import { NavStore } from '../../../core/state/nav.store';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

const SKELETON_GROUP_COUNT = 6;

// This screen *is* the sidebar's content in full-page form (per the plan) -
// same NavStore, same load-on-locale-change pattern as SidebarNav and Home,
// just rendered as a flat directory instead of a collapsible tree.
@Component({
  selector: 'app-docs-index',
  imports: [RouterLink, ErrorState, Skeleton, TranslatePipe],
  templateUrl: './docs-index.html',
  styleUrl: './docs-index.scss',
})
export class DocsIndex {
  protected readonly navStore = inject(NavStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly skeletonGroups = Array.from({ length: SKELETON_GROUP_COUNT }, (_, i) => i);

  private readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale'))),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const locale = this.locale();
      if (locale) {
        this.navStore.load(locale as LocaleCode);
      }
    });
  }

  protected retry(): void {
    const locale = this.locale();
    if (locale) {
      this.navStore.load(locale as LocaleCode);
    }
  }
}
