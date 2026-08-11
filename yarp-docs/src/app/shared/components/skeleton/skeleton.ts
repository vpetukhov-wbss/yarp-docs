import { Component, input } from '@angular/core';

// A single shimmering placeholder bar - the only shared primitive. Screens
// compose several of these into whatever shape they need (DocArticle's
// h1/lede/paragraph skeleton, Home's card grid, DocsIndex's list) rather
// than this component knowing about any of those layouts itself.
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    'aria-hidden': 'true',
  },
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1em');
}
