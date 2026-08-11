import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { SUPPORTED_LOCALES } from '../../core/locales';

@Component({
  selector: 'app-language-picker',
  templateUrl: './language-picker.html',
  styleUrl: './language-picker.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class LanguagePicker {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly route = inject(ActivatedRoute);

  protected readonly locales = SUPPORTED_LOCALES;
  protected readonly open = signal(false);

  // Reads the ':locale' route param reactively. Not yet backed by LocaleStore
  // (that lands in Step 8) - this only reflects the URL, it can't switch it.
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

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
