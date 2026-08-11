import { Injectable } from '@angular/core';

interface ForcedError {
  readonly urlContains: string;
  readonly status: number;
}

// Dev-only, environment-gated (never registered when environment.useMockApi
// is false - see app.config.ts). Reads simulation flags once from the page's
// own URL so failure/latency scenarios are repeatable and scriptable (e.g.
// in Playwright), not just eyeballed:
//   ?mockDelay=2000       - force artificial latency on every mock request
//   ?mockError=pages:500  - force the next request whose URL contains
//                           "pages" to fail with the given HTTP status
//   ?mockOffline=1        - force every request to fail (status 0, mimics
//                           a network-level failure) - drives the global
//                           offline screen
@Injectable({ providedIn: 'root' })
export class MockNetworkConditions {
  private readonly params = new URLSearchParams(globalThis.location?.search ?? '');
  private readonly offline = this.params.get('mockOffline') === '1';
  private readonly forcedError = this.parseForcedError();

  readonly delayMs: number = this.parseDelay();

  forcedStatusFor(url: string): number | null {
    if (this.offline) {
      return 0;
    }
    if (this.forcedError && url.includes(this.forcedError.urlContains)) {
      return this.forcedError.status;
    }
    return null;
  }

  private parseDelay(): number {
    const raw = this.params.get('mockDelay');
    const parsed = raw === null ? 0 : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private parseForcedError(): ForcedError | null {
    const raw = this.params.get('mockError');
    if (!raw) {
      return null;
    }
    const [urlContains, statusRaw] = raw.split(':');
    const status = Number(statusRaw);
    if (!urlContains || !Number.isFinite(status)) {
      return null;
    }
    return { urlContains, status };
  }
}
