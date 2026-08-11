import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

// Static copy only - no NavStore, no loading/error states. Matches any
// unmatched path inside a valid :locale segment (a genuinely bad slug, not
// an unresolvable locale - that's locale.guard.ts's job instead).
//
// Its `path: '**'` match can consume more than one URL segment (e.g.
// /en/foo/bar/baz), and a relative routerLink like `../docs` only pops ONE
// segment from that match, not one ActivatedRoute level - it would land on
// /en/foo/bar/docs instead of /en/docs. Absolute links built from the
// (param-inherited, see withRouterConfig's paramsInheritanceStrategy) locale
// param sidestep that entirely.
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private readonly route = inject(ActivatedRoute);

  protected readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale'))),
    { initialValue: null },
  );
}
