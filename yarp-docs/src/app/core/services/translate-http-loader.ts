import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateLoader, type TranslationObject } from '@ngx-translate/core';
import { map, type Observable } from 'rxjs';

import type { LocaleCode } from '../models/locale.model';
import { PLATFORM_TRANSLATIONS } from '../platform-translations';

@Injectable()
export class TranslateHttpLoader extends TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<TranslationObject> {
    return this.http.get<TranslationObject>(`/assets/i18n/${lang}.json`).pipe(
      map((baseTranslations) => {
        const platformTranslations = PLATFORM_TRANSLATIONS[lang as LocaleCode];
        return platformTranslations
          ? mergeTranslations(baseTranslations, platformTranslations)
          : baseTranslations;
      }),
    );
  }
}

function mergeTranslations(
  base: TranslationObject,
  overlay: TranslationObject,
): TranslationObject {
  const result: TranslationObject = { ...base };

  for (const [key, overlayValue] of Object.entries(overlay)) {
    const baseValue = result[key];

    result[key] = isTranslationObject(baseValue) && isTranslationObject(overlayValue)
      ? mergeTranslations(baseValue, overlayValue)
      : overlayValue;
  }

  return result;
}

function isTranslationObject(value: unknown): value is TranslationObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
