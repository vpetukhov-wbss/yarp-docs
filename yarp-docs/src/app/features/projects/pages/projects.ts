import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../core/models/locale.model';
import { localized, publicProjectCatalog } from '../data/public-project-catalog';

@Component({
  selector: 'app-projects',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  private readonly route = inject(ActivatedRoute);

  protected readonly locale = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('locale') as LocaleCode | null)),
    { initialValue: null },
  );

  protected readonly projects = computed(() =>
    publicProjectCatalog.map((project) => ({
      ...project,
      domainLabel: localized(project.domain, this.locale()),
      description: localized(project.shortDescription, this.locale()),
      problemLabel: localized(project.problem, this.locale()),
      statusLabel: localized(project.status, this.locale()),
    })),
  );
}
