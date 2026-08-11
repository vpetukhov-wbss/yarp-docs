import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MobileNavStore } from '../../core/state/mobile-nav.store';
import { LanguagePicker } from '../language-picker/language-picker';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, LanguagePicker, ThemeToggle, TranslatePipe],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly mobileNav = inject(MobileNavStore);
}
