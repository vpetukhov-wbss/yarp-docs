import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { TitleStrategy, provideRouter, withRouterConfig } from '@angular/router';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { DEFAULT_LOCALE } from './core/locales';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { TranslateHttpLoader } from './core/services/translate-http-loader';
import { AppTitleStrategy } from './core/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // paramsInheritanceStrategy: 'always' merges ancestor route params into
    // every descendant's paramMap - DocArticle (':slug', a child of
    // ':locale') needs both params together without manually walking
    // route.parent.
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    { provide: TitleStrategy, useExisting: AppTitleStrategy },
    provideHttpClient(
      withFetch(),
      withInterceptors(environment.useMockApi ? [mockApiInterceptor] : []),
    ),
    // UI chrome strings only (public/assets/i18n/*.json) - body content
    // (public/assets/mock-api/**) is a completely separate concern with its
    // own fallback story (DocPage.translated), not routed through
    // ngx-translate at all. LocaleGuard calls TranslateService.use() once
    // the :locale segment is validated.
    provideTranslateService({
      lang: DEFAULT_LOCALE,
      fallbackLang: DEFAULT_LOCALE,
      loader: provideTranslateLoader(TranslateHttpLoader),
    }),
    provideClientHydration(withEventReplay()),
  ],
};
