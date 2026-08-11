import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ThemeStore } from '../../core/state/theme.store';

@Component({
  selector: 'app-theme-toggle',
  imports: [TranslatePipe],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  protected readonly store = inject(ThemeStore);
}
