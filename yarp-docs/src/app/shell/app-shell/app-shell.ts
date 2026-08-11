import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ConnectivityStore } from '../../core/state/connectivity.store';
import { OfflineScreen } from '../offline-screen/offline-screen';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-shell',
  imports: [SiteHeader, RouterOutlet, OfflineScreen, TranslatePipe],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  protected readonly connectivity = inject(ConnectivityStore);
}
