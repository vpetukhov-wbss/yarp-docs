import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import { MobileNavStore } from '../../core/state/mobile-nav.store';
import { SEARCH_QUERY_PARAM } from '../../features/search/search-query-param';
import { isApplePlatform } from '../../shared/utils/platform';
import { LanguagePicker } from '../language-picker/language-picker';
import { SupportButton } from '../support-button/support-button';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LanguagePicker, ThemeToggle, SupportButton, TranslatePipe],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly mobileNav = inject(MobileNavStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale'))),
    { initialValue: 'en' },
  );
  protected readonly isApple = isApplePlatform();
  protected readonly shortcutKey = this.isApple ? '⌘K' : 'Ctrl+K';

  protected openSearch(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [SEARCH_QUERY_PARAM]: '1' },
      queryParamsHandling: 'merge',
    });
  }
}
