import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, tap, throwError } from 'rxjs';

import { ConnectivityStore } from '../state/connectivity.store';
import { MockNetworkConditions } from '../services/mock-network-conditions';

// Only registered when environment.useMockApi is true (see app.config.ts) -
// a production build against the real API contains none of this. Makes mock
// mode indistinguishable in URL shape from the outside (DocsApiService never
// knows it's talking to flat files) and layers in the scriptable
// delay/error/offline simulation from MockNetworkConditions.
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const conditions = inject(MockNetworkConditions);
  const connectivity = inject(ConnectivityStore);

  const jsonUrl = req.url.endsWith('.json') ? req.url : `${req.url}.json`;
  const jsonReq = req.clone({ url: jsonUrl });

  const forcedStatus = conditions.forcedStatusFor(jsonReq.url);
  const response$ =
    forcedStatus !== null
      ? throwError(() => new HttpErrorResponse({ status: forcedStatus, url: jsonReq.url }))
      : next(jsonReq);

  return response$.pipe(
    delay(conditions.delayMs),
    tap({
      // Any response at all - even a 404 for an unseeded slug, or a forced
      // 500 from ?mockError= - means the API is reachable; only a status-0
      // network-level failure (?mockOffline=1, or a real dropped
      // connection) is a connectivity problem, not a content-level one.
      next: () => connectivity.reportSuccess(),
      error: (error: unknown) => {
        const isConnectivityFailure = error instanceof HttpErrorResponse && error.status === 0;
        if (isConnectivityFailure) {
          connectivity.reportFailure();
        } else {
          connectivity.reportSuccess();
        }
      },
    }),
  );
};
