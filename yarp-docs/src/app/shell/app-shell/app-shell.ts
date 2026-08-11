import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-shell',
  imports: [SiteHeader, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
