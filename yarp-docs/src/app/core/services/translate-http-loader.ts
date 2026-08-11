import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateLoader, type TranslationObject } from '@ngx-translate/core';
import type { Observable } from 'rxjs';

@Injectable()
export class TranslateHttpLoader extends TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<TranslationObject> {
    return this.http.get<TranslationObject>(`/assets/i18n/${lang}.json`);
  }
}
