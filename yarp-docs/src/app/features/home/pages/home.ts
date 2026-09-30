import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import { localized, publicProjectCatalog } from '../../projects/data/public-project-catalog';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly route = inject(ActivatedRoute);

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

  protected readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale') as LocaleCode | null)),
    { initialValue: null },
  );

  protected readonly featuredProjects = computed(() =>
    publicProjectCatalog.map((project) => ({
      ...project,
      domainLabel: localized(project.domain, this.locale()),
      description: localized(project.shortDescription, this.locale()),
    })),
  );
}
