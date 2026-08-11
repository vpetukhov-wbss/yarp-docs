import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// Zero inputs by design - the parent screen decides *whether* to render this
// (`@if (!store.translated())`), so the component itself only needs to know
// how to render its one fixed message once it's placed in the DOM.
@Component({
  selector: 'app-translation-banner',
  imports: [TranslatePipe],
  templateUrl: './translation-banner.html',
  styleUrl: './translation-banner.scss',
})
export class TranslationBanner {}
