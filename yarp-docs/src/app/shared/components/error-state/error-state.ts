import { Component, input } from '@angular/core';

// Pure title/body shell for a "loading failed" state - the CTA (retry
// button, or a link for a 404) is projected, not an input/output, because
// the right action differs by caller (DocArticle's 404 links to /docs;
// everywhere else retries the same load). Reused by DocArticle, Home,
// DocsIndex, and OfflineScreen.
@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
}
