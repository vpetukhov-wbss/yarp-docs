import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import { NavStore } from '../../../core/state/nav.store';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

// Loading skeleton renders this many placeholder cards - matches the current
// group count closely enough to avoid a layout jump on success, without
// coupling the skeleton to the real (fetched) group count.
const SKELETON_CARD_COUNT = 11;

@Component({
  selector: 'app-home',
  imports: [RouterLink, ErrorState, Skeleton, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly navStore = inject(NavStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly skeletonCards = Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => i);

  // Also read directly in the template to build absolute link targets - a
  // relative link like `../docs` from this route is unusable here: Home
  // matches the *empty* path segment, so it has nothing of its own to pop,
  // and in practice that climbs past the :locale segment too, producing a
  // locale-less URL like `/docs` instead of `/en/docs` (confirmed by
  // navigating it - a real bug, not a hypothetical).
  protected readonly locale = toSignal(
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
