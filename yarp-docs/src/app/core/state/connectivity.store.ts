import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

export type ApiHealth = 'ok' | 'degraded' | 'down';

interface ConnectivityState {
  health: ApiHealth;
}

// Fed by two sources: the browser's own online/offline events (below), and
// mock-api.interceptor.ts reporting on every request it observes - a status
// 0 (network-level failure, what ?mockOffline=1 simulates) means down; any
// response at all - including a 4xx/5xx business error like a missing page -
// means the API is reachable, so it reports success. AppShell swaps in the
// global OfflineScreen when health is 'down' and recovers automatically the
// next time any request succeeds.
//
// 'degraded' is a reserved state, not produced anywhere yet - there's no
// concrete signal in this phase (e.g. elevated latency) worth turning into a
// real threshold, and a fabricated one would be worse than not having it.
export const ConnectivityStore = signalStore(
  { providedIn: 'root' },
  withState<ConnectivityState>({ health: 'ok' }),
  withMethods((store) => ({
    reportSuccess(): void {
      patchState(store, { health: 'ok' });
    },
    reportFailure(): void {
      patchState(store, { health: 'down' });
    },
  })),
  withHooks({
    onInit(store) {
      const syncFromBrowser = (): void => {
        patchState(store, { health: navigator.onLine ? 'ok' : 'down' });
      };
      window.addEventListener('online', syncFromBrowser);
      window.addEventListener('offline', syncFromBrowser);
      syncFromBrowser();
    },
  }),
);
