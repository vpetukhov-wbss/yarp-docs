import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-about',
  imports: [TranslatePipe],
  template: `
    <main id="main" class="page">
      <header class="hero">
        <p class="eyebrow">{{ 'about.eyebrow' | translate }}</p>
        <h1>{{ 'about.title' | translate }}</h1>
        <p class="lede">{{ 'about.lede' | translate }}</p>
      </header>
      <section class="grid">
        <article><h2>{{ 'about.focus' | translate }}</h2><p>.NET backend systems · domain architecture · SaaS · compliance · distributed systems · AI infrastructure · cross-platform .NET</p></article>
        <article><h2>{{ 'about.principles' | translate }}</h2><p>Simple code · explicit domain boundaries · documentation-driven development · testable vertical slices · pragmatic use of AI</p></article>
      </section>
      <section class="statement">
        <p>{{ 'about.statement' | translate }}</p>
      </section>
    </main>
  `,
  styles: [`
    .page{max-width:960px;margin:0 auto;padding:72px 48px 110px}.hero{max-width:760px}.eyebrow{margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}h1{margin:0 0 16px;font-size:clamp(2.6rem,6vw,5rem);line-height:.95;letter-spacing:-.05em;color:var(--ink)}.lede{margin:0;font-size:19px;line-height:1.7;color:var(--muted)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:56px}.grid article{padding:24px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}h2{margin:0 0 10px;font-size:18px;color:var(--ink)}.grid p{margin:0;line-height:1.7;color:var(--muted)}.statement{margin-top:56px;padding-top:36px;border-top:1px solid var(--border)}.statement p{max-width:62ch;margin:0;font-size:22px;line-height:1.55;color:var(--ink-soft)}@media(max-width:720px){.page{padding:44px 20px 72px}.grid{grid-template-columns:1fr}}
  `],
})
export class About {}
