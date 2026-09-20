import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-engineering',
  imports: [TranslatePipe],
  template: `
    <main id="main" class="page">
      <header class="hero">
        <p class="eyebrow">{{ 'engineering.eyebrow' | translate }}</p>
        <h1>{{ 'engineering.title' | translate }}</h1>
        <p class="lede">{{ 'engineering.lede' | translate }}</p>
      </header>

      <section class="practice-grid">
        <article><h2>{{ 'engineering.architectureCard' | translate }}</h2><p>{{ 'engineering.architectureBody' | translate }}</p></article>
        <article><h2>{{ 'engineering.dotnetCard' | translate }}</h2><p>{{ 'engineering.dotnetBody' | translate }}</p></article>
        <article><h2>{{ 'engineering.reliabilityCard' | translate }}</h2><p>{{ 'engineering.reliabilityBody' | translate }}</p></article>
        <article><h2>{{ 'engineering.qualityCard' | translate }}</h2><p>{{ 'engineering.qualityBody' | translate }}</p></article>
        <article><h2>{{ 'engineering.aiCard' | translate }}</h2><p>{{ 'engineering.aiBody' | translate }}</p></article>
        <article><h2>{{ 'engineering.yarpCard' | translate }}</h2><p>{{ 'engineering.yarpBody' | translate }}</p></article>
      </section>

      <section class="process">
        <p class="eyebrow">{{ 'engineering.practiceEyebrow' | translate }}</p>
        <h2>{{ 'engineering.practiceTitle' | translate }}</h2>
        <div class="flow" [attr.aria-label]="'process.aria' | translate">
          @for (stepKey of processStepKeys; track stepKey; let last = $last) {
            <span>{{ stepKey | translate }}</span>@if (!last) { <b aria-hidden="true">→</b> }
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    .page{max-width:1120px;margin:0 auto;padding:64px 48px 104px}.hero{max-width:780px;margin-bottom:48px}.eyebrow{margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}h1{margin:0 0 16px;font-size:clamp(2.6rem,6vw,5.2rem);line-height:.94;letter-spacing:-.05em;color:var(--ink)}.lede{margin:0;font-size:18px;line-height:1.65;color:var(--muted)}.practice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.practice-grid article{padding:24px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}h2{margin:0 0 10px;font-size:21px;color:var(--ink)}.practice-grid p{margin:0;line-height:1.65;color:var(--muted)}.process{margin-top:64px;padding-top:48px;border-top:1px solid var(--border)}.process h2{font-size:30px}.flow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:22px}.flow span{padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);font-size:13px;font-weight:650;color:var(--ink-soft)}.flow b{color:var(--faint)}@media(max-width:720px){.page{padding:44px 20px 72px}.practice-grid{grid-template-columns:1fr}}
  `],
})
export class Engineering {
  protected readonly processStepKeys = [
    'process.problem',
    'process.domain',
    'process.architecture',
    'process.ux',
    'process.api',
    'process.implementation',
    'process.tests',
    'process.operations',
  ] as const;
}
