import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // paramsInheritanceStrategy: 'always' merges ancestor route params into
    // every descendant's paramMap - DocArticle (':slug', a child of
    // ':locale') needs both params together without manually walking
    // route.parent.
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideHttpClient(
      withFetch(),
      withInterceptors(environment.useMockApi ? [mockApiInterceptor] : []),
    ),
  ],
};
