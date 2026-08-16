import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { RouterStateSnapshot } from '@angular/router';
import { TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, switchMap } from 'rxjs';

import { SeoService } from './seo.service';

// Handles only the app's static routes (home, docs-index, not-found), each
// declaring its own translated page-title fragment (and optionally a
// meta-description fragment) via route data.titleKey/descriptionKey - see
// app.routes.ts. DocArticle's title and description are page content, not
// route constants - it has neither key and sets Title/Meta itself once its
// page has actually loaded (see doc-article.ts's own effect), so this
// strategy is a no-op for that route rather than fighting it.
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const titleKey = route.data['titleKey'] as string | undefined;
    if (!titleKey) {
      return;
    }

    // Not-found has a titleKey (for the <title> itself) but isn't a real,
    // indexable page - no canonical/hreflang/social tags for it.
    const isNotFound = route.routeConfig?.path === '**';
    const locale = route.params?.['locale'] as string | undefined;
    if (locale && !isNotFound) {
      const pathSuffix = snapshot.url.slice(locale.length + 1);
      this.seo.setCanonical(snapshot.url);
      this.seo.setHreflangAlternates(pathSuffix);
    }

    // Chained, not parallel: meta.titleTemplate's {{title}} param needs
    // titleKey's OWN resolved value, and both calls share the same
    // loadingTranslations gate in TranslateService.get() - by the time the
    // first resolves, the active locale's catalog is already loaded, so the
    // second never has to wait on it again.
    const title$ = this.translate
      .get(titleKey)
      .pipe(switchMap((pageTitle: string) => this.translate.get('meta.titleTemplate', { title: pageTitle })));

    const descriptionKey = route.data['descriptionKey'] as string | undefined;
    if (!descriptionKey) {
      title$.subscribe((title: string) => this.title.setTitle(title));
      return;
    }

    // Combined (not two independent subscriptions) so setSocialTags always
    // sees the title that was JUST set, never a stale one left over from
    // the previous route - the two calls would otherwise race.
    combineLatest([title$, this.translate.get(descriptionKey)]).subscribe(([title, description]) => {
      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      if (locale && !isNotFound) {
        this.seo.setSocialTags({ title, description, path: snapshot.url });
      }
    });
  }
}
