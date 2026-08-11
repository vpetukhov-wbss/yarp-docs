import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import { SUPPORTED_LOCALES } from '../../core/locales';
import type { LocaleCode } from '../../core/models/locale.model';

@Component({
  selector: 'app-language-picker',
  imports: [TranslatePipe],
  templateUrl: './language-picker.html',
  styleUrl: './language-picker.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class LanguagePicker {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly locales = SUPPORTED_LOCALES;
  protected readonly open = signal(false);

  protected readonly currentLocale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale'))),
    { initialValue: null },
  );

  protected readonly currentLabel = computed(() => {
    const code = this.currentLocale();
    return this.locales.find((locale) => locale.code === code)?.code.toUpperCase() ?? 'EN';
  });

  protected toggleOpen(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  // Navigates to the same path under the new locale (e.g. /en/load-balancing
  // -> /bg/load-balancing); LocaleGuard does the rest (validate, persist,
  // switch TranslateService) once the new route activates - this only ever
  // needs to know what to navigate to, not how a locale switch is applied.
  protected switchLocale(code: LocaleCode): void {
    const rest = this.router.url.replace(/^\/[^/]+/, '');
    void this.router.navigateByUrl(`/${code}${rest}`);
    this.close();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
