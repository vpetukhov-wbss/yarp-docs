import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import type { DocPageLink } from '../../../core/models/doc-page.model';

@Component({
  selector: 'app-prev-next',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './prev-next.html',
  styleUrl: './prev-next.scss',
})
export class PrevNext {
  readonly prev = input<DocPageLink | null>(null);
  readonly next = input<DocPageLink | null>(null);
}
