import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';

const COPIED_CLASS = 'copied';
const COPIED_RESET_MS = 1600;

// Attaches copy-to-clipboard behaviour to any `.copy-btn[data-copy]` button
// found inside the host element - content that arrived as raw server HTML
// via [innerHTML], so it can't carry Angular (click) bindings of its own.
// Bind the same value driving [innerHTML] to this directive's input so it
// re-scans after every content swap (afterRenderEffect tracks whatever
// signals are read inside it - old listeners don't need explicit cleanup
// since innerHTML replacement already discards the DOM nodes they were on).
//
// Content-agnostic and reusable by design - lives in shared/, not
// features/doc-article/, so any future feature rendering raw HTML with code
// blocks can reuse it without an upward dependency from shared/ back into a
// feature.
@Directive({
  selector: '[appCodeBlockEnhancer]',
})
export class CodeBlockEnhancerDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly watch = input<unknown>(undefined, { alias: 'appCodeBlockEnhancer' });

  constructor() {
    afterRenderEffect(() => {
      this.watch();
      this.attachCopyHandlers();
    });
  }

  private attachCopyHandlers(): void {
    const buttons = this.elementRef.nativeElement.querySelectorAll<HTMLButtonElement>('.copy-btn');
    buttons.forEach((button) => {
      button.addEventListener('click', () => void this.handleCopyClick(button));
    });
  }

  private async handleCopyClick(button: HTMLButtonElement): Promise<void> {
    const targetId = button.dataset['copy'];
    const codeElement = targetId ? document.getElementById(targetId) : null;
    const text = codeElement?.innerText ?? '';

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    button.classList.add(COPIED_CLASS);
    setTimeout(() => button.classList.remove(COPIED_CLASS), COPIED_RESET_MS);
  }
}
