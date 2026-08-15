import { Component, ViewEncapsulation, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { CodeBlockEnhancerDirective } from '../../directives/code-block-enhancer.directive';
import { InternalLinkRouterDirective } from '../../directives/internal-link-router.directive';

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
// public/assets/mock-api/**, generated entirely by this repo's own content
// compiler (scripts/content/build-content.mjs, compiling
// content/<locale>/<slug>.md, itself grounded in Microsoft Learn PDFs via
// scripts/content/extract-pdf.mjs) - never user input, never a third party,
// at any point in this request path.
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
// silently not apply to any of this. Since encapsulation buys nothing here
// anyway, the styles for this content live in src/styles/_doc-body.scss
// (global, `@use`'d from styles.scss) rather than a component styleUrl -
// component styles still count against Angular's anyComponentStyle budget
// even when ViewEncapsulation.None makes them logically global, and this
// file was creeping toward that ceiling. Every selector there is nested
// under the single `.doc-body` host class so "global file" doesn't mean
// "leaks app-wide" - it's contained the same way encapsulation would have
// contained it, just by hand.
@Component({
  selector: 'app-doc-body',
  imports: [CodeBlockEnhancerDirective, InternalLinkRouterDirective],
  templateUrl: './doc-body.html',
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
