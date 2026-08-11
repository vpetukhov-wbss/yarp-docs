import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MobileNavStore } from '../../core/state/mobile-nav.store';
import { LanguagePicker } from '../language-picker/language-picker';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, LanguagePicker, ThemeToggle],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly mobileNav = inject(MobileNavStore);
}
