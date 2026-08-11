import { Component, ViewEncapsulation, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { CodeBlockEnhancerDirective } from '../../directives/code-block-enhancer.directive';

// bodyHtml is rendered via DomSanitizer.bypassSecurityTrustHtml, not a plain
// [innerHTML] binding - deliberately, and only after confirming Angular's
// default sanitizer can't render this content at all. Checked directly
// against the installed @angular/core source
// (VALID_ELEMENTS/VALID_ATTRS in fesm2022/_debug_node-chunk.mjs): <svg> and
// <button> aren't in its element allowlist, and neither `id` nor any
// `data-*` attribute is in its attribute allowlist - a plain [innerHTML]
// binding silently deleted every copy button, every icon, and the id the
// copy button needs to find its <code> sibling. That allowlist is tuned for
// "rendered user comments," not a docs site's own structured content.
//
// This is safe here because of where bodyHtml actually comes from: only
// public/assets/mock-api/**, generated entirely by this repo's own
// scripts/build-mock-content.mjs (Step 11) from Microsoft Learn PDFs - never
// user input, never a third party, at any point in this request path.
//
// This stops being automatically safe the moment environment.apiBaseUrl
// points at a real .NET API with its own content authors/translators
// (Step 16) - that's a new trust boundary, and revisiting this decision
// (e.g. server-side sanitization with a matching allowlist) belongs in that
// phase, not this one.
//
// Deliberately ViewEncapsulation.None: Angular's scoped-style attributes are
// only added to elements the framework itself creates from a template,
// never to nodes injected via [innerHTML] - normal component styles would
// silently not apply to any of this. Every selector in doc-body.scss is
// nested under the single `.doc-body` host class so "no encapsulation"
// doesn't mean "leaks app-wide" - it's contained the same way encapsulation
// would have contained it, just by hand.
@Component({
  selector: 'app-doc-body',
  imports: [CodeBlockEnhancerDirective],
  templateUrl: './doc-body.html',
  styleUrl: './doc-body.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'doc-body' },
})
export class DocBody {
  private readonly sanitizer = inject(DomSanitizer);

  readonly bodyHtml = input.required<string>();

  protected get trustedBodyHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.bodyHtml());
  }
}
