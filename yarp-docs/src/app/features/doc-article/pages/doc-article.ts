import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-doc-article',
  templateUrl: './doc-article.html',
  styleUrl: './doc-article.scss',
})
export class DocArticle {
  private readonly route = inject(ActivatedRoute);

  protected readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))), {
    initialValue: null,
  });
}
