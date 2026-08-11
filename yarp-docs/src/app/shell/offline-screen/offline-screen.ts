import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ErrorState } from '../../shared/components/error-state/error-state';

// Swapped in for <router-outlet> by AppShell whenever ConnectivityStore
// reports 'down' - see connectivity.store.ts for how that's detected and how
// recovery happens automatically. The one manual action offered here is a
// full reload: ConnectivityStore itself has no "recheck now" primitive (it's
// purely reactive to the browser's online/offline events and to the mock
// interceptor's per-request reporting), so reloading is the one action
// guaranteed to re-run real requests and pick up a restored connection.
@Component({
  selector: 'app-offline-screen',
  imports: [ErrorState, TranslatePipe],
  templateUrl: './offline-screen.html',
  styleUrl: './offline-screen.scss',
})
export class OfflineScreen {
  protected reload(): void {
    window.location.reload();
  }
}
