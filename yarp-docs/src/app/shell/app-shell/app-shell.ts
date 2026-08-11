import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-shell',
  imports: [SiteHeader, RouterOutlet, TranslatePipe],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
