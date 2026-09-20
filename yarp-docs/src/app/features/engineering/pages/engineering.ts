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
        <article><h2>Architecture</h2><p>DDD · CQRS · Modular Monolith · Vertical Slice · bounded contexts</p></article>
        <article><h2>.NET</h2><p>ASP.NET Core · EF Core · Blazor · MAUI · Aspire · OpenTelemetry</p></article>
        <article><h2>Reliability</h2><p>Result Pattern · idempotency · optimistic concurrency · outbox · resilience · observability</p></article>
        <article><h2>Code quality</h2><p>Clean Code · KISS · YAGNI · DRY · modern C# · BCL-first engineering</p></article>
        <article><h2>AI-assisted engineering</h2><p>Architecture rules · agents · automated review · documentation-assisted implementation · controlled code generation</p></article>
        <article><h2>YARP Reverse Proxy</h2><p>Routing · transforms · authentication & authorization · health checks · forwarding · diagnostics</p></article>
      </section>

      <section class="process">
        <p class="eyebrow">{{ 'engineering.practiceEyebrow' | translate }}</p>
        <h2>{{ 'engineering.practiceTitle' | translate }}</h2>
        <div class="flow" aria-label="Problem to operations engineering flow">
          @for (step of ['Problem', 'Domain', 'Architecture', 'UX', 'API', 'Implementation', 'Tests', 'Operations']; track step; let last = $last) {
            <span>{{ step }}</span>@if (!last) { <b aria-hidden="true">→</b> }
          }
        </div>
      </section>
    </main>
  `,
  styles: [`
    .page{max-width:1120px;margin:0 auto;padding:64px 48px 104px}.hero{max-width:780px;margin-bottom:48px}.eyebrow{margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}h1{margin:0 0 16px;font-size:clamp(2.6rem,6vw,5.2rem);line-height:.94;letter-spacing:-.05em;color:var(--ink)}.lede{margin:0;font-size:18px;line-height:1.65;color:var(--muted)}.practice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.practice-grid article{padding:24px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}h2{margin:0 0 10px;font-size:21px;color:var(--ink)}.practice-grid p{margin:0;line-height:1.65;color:var(--muted)}.process{margin-top:64px;padding-top:48px;border-top:1px solid var(--border)}.process h2{font-size:30px}.flow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:22px}.flow span{padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);font-size:13px;font-weight:650;color:var(--ink-soft)}.flow b{color:var(--faint)}@media(max-width:720px){.page{padding:44px 20px 72px}.practice-grid{grid-template-columns:1fr}}
  `],
})
export class Engineering {}
