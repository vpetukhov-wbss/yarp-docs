import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { DocHeading } from '../../core/models/doc-page.model';

@Component({
  selector: 'app-page-toc',
  imports: [TranslatePipe],
  templateUrl: './page-toc.html',
  styleUrl: './page-toc.scss',
})
export class PageToc {
  readonly headings = input<readonly DocHeading[]>([]);
  readonly activeId = input<string | null>(null);
  readonly sourceUrl = input<string | null>(null);
}
