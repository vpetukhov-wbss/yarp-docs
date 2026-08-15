import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MobileNavStore } from '../../core/state/mobile-nav.store';
import { SEARCH_QUERY_PARAM } from '../../features/search/search-query-param';
import { LanguagePicker } from '../language-picker/language-picker';
import { SupportButton } from '../support-button/support-button';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, LanguagePicker, ThemeToggle, SupportButton, TranslatePipe],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly mobileNav = inject(MobileNavStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Same navigation SearchDialog's own Ctrl/Cmd+K handler performs - see
  // search-query-param.ts for why this is a shared constant rather than a
  // shared service.
  protected openSearch(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [SEARCH_QUERY_PARAM]: '1' },
      queryParamsHandling: 'merge',
    });
  }
}
