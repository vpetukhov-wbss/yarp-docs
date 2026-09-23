import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import { SeoService } from '../../../core/seo.service';
import { findPublicProject, localized } from '../data/public-project-catalog';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly seo = inject(SeoService);

  protected readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale') as LocaleCode | null)),
    { initialValue: null },
  );
  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('projectSlug'))),
    { initialValue: null },
  );

  protected readonly project = computed(() => {
    const project = findPublicProject(this.slug());
    if (!project) return undefined;

    return {
      ...project,
      domainLabel: localized(project.domain, this.locale()),
      description: localized(project.shortDescription, this.locale()),
      problemLabel: localized(project.problem, this.locale()),
      statusLabel: localized(project.status, this.locale()),
      targetUsers: project.targetUsers.map((item) => localized(item, this.locale())),
      highlights: project.engineeringHighlights.map((item) => localized(item, this.locale())),
    };
  });

  constructor() {
    effect(() => {
      const project = this.project();
      const locale = this.locale();
      if (!project || !locale) return;

      const title = `${project.name} · YARP.DEV`;
      const path = `/${locale}/projects/${project.slug}`;
      const suffix = `/projects/${project.slug}`;

      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: project.description });
      this.seo.setCanonical(path);
      this.seo.setHreflangAlternates(suffix);
      this.seo.setSocialTags({ title, description: project.description, path });
    });
  }
}
