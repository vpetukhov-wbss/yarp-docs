import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { RouterStateSnapshot } from '@angular/router';
import { TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';

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

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const titleKey = route.data['titleKey'] as string | undefined;
    if (!titleKey) {
      return;
    }
    // Chained, not parallel: meta.titleTemplate's {{title}} param needs
    // titleKey's OWN resolved value, and both calls share the same
    // loadingTranslations gate in TranslateService.get() - by the time the
    // first resolves, the active locale's catalog is already loaded, so the
    // second never has to wait on it again.
    this.translate
      .get(titleKey)
      .pipe(switchMap((pageTitle: string) => this.translate.get('meta.titleTemplate', { title: pageTitle })))
      .subscribe((title: string) => {
        this.title.setTitle(title);
      });

    const descriptionKey = route.data['descriptionKey'] as string | undefined;
    if (descriptionKey) {
      this.translate.get(descriptionKey).subscribe((description: string) => {
        this.meta.updateTag({ name: 'description', content: description });
      });
    }
  }
}
