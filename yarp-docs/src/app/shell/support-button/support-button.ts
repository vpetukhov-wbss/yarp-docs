import { Component, ElementRef, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

const REVOLUT_HANDLE = 'vladim993n';

@Component({
  selector: 'app-support-button',
  imports: [TranslatePipe],
  templateUrl: './support-button.html',
  styleUrl: './support-button.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SupportButton {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly open = signal(false);

  // Revolut.me prefills the amount from a cents-valued `amount` query param
  // (`500` -> €5) - verified against the live page, since there's no
  // documented spec for this and a wrong guess sends the visitor to a blank
  // amount field instead of the intended one.
  protected readonly beerUrl = `https://revolut.me/${REVOLUT_HANDLE}?amount=500`;
  protected readonly knuckleUrl = `https://revolut.me/${REVOLUT_HANDLE}?amount=1000`;

  protected toggleOpen(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
