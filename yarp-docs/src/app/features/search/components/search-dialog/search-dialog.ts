import { Component, afterRenderEffect, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

import type { LocaleCode } from '../../../../core/models/locale.model';
import type { SearchIndexEntry } from '../../../../core/models/search-entry.model';
import { NavStore } from '../../../../core/state/nav.store';
import { SEARCH_QUERY_PARAM } from '../../search-query-param';
import { SearchStore } from '../../state/search.store';

const RECENT_STORAGE_PREFIX = 'yarp-docs:recent:';
const MAX_RECENT = 5;

interface ResultGroup {
  readonly groupId: string;
  readonly label: string;
  readonly items: readonly SearchIndexEntry[];
}

// Global overlay, always mounted in AppShell regardless of route - opened
// from SiteHeader's search trigger(s) or Ctrl/Cmd+K, closed by Escape, the
// scrim, or selecting a result. Its open/closed state is the one thing
// synced through the URL (the `search` query param, see
// ../search-query-param.ts), not a route of its own and not local component
// state - that's what makes it deep-linkable and gives it back-button
// support for free.
@Component({
  selector: 'app-search-dialog',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './search-dialog.html',
  styleUrl: './search-dialog.scss',
  host: {
    '(document:keydown)': 'onGlobalKeydown($event)',
  },
})
export class SearchDialog {
  protected readonly store = inject(SearchStore);
  private readonly navStore = inject(NavStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly dialogRoot = viewChild<ElementRef<HTMLElement>>('dialogRoot');

  protected readonly recent = signal<string[]>([]);

  protected readonly locale = toSignal(this.route.paramMap.pipe(map((params) => params.get('locale'))), {
    initialValue: null,
  });

  protected readonly open = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.has(SEARCH_QUERY_PARAM))),
    { initialValue: false },
  );

  protected readonly groupedResults = computed<ResultGroup[]>(() => {
    const groups = this.navStore.groups();
    const byGroup = new Map<string, SearchIndexEntry[]>();
    for (const entry of this.store.results()) {
      const list = byGroup.get(entry.group);
      if (list) {
        list.push(entry);
      } else {
        byGroup.set(entry.group, [entry]);
      }
    }
    return Array.from(byGroup.entries()).map(([groupId, items]) => ({
      groupId,
      label: groups.find((group) => group.id === groupId)?.label ?? groupId,
      items,
    }));
  });

  constructor() {
    let wasOpen = false;
    afterRenderEffect(() => {
      const isOpen = this.open();
      if (isOpen && !wasOpen) {
        this.searchInput()?.nativeElement.focus();
      }
      wasOpen = isOpen;
    });

    effect(() => {
      const locale = this.locale();
      if (!this.open() || !locale) {
        return;
      }
      this.loadRecent(locale as LocaleCode);
      if (this.store.indexLocale() !== locale || this.store.indexStatus() === 'error') {
        this.store.loadIndex(locale as LocaleCode);
      }
    });
  }

  protected onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.open()) {
        this.close();
      } else {
        this.openDialog();
      }
    }
  }

  protected onInput(event: Event): void {
    this.store.setQuery((event.target as HTMLInputElement).value);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.store.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.store.moveHighlight(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const result = this.store.highlightedResult();
        if (result) {
          this.selectResult(result);
        }
        break;
      }
    }
  }

  // Escape and Tab-trapping apply no matter which element inside the dialog
  // currently has focus, so they're handled at the dialog root (where the
  // event has bubbled to), not just the input.
  protected onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  protected selectResult(entry: SearchIndexEntry): void {
    const locale = this.locale();
    if (!locale) {
      return;
    }
    this.saveRecent(locale as LocaleCode, this.store.query());
    this.close();
    const target = entry.anchor ? `/${locale}/${entry.slug}#${entry.anchor}` : `/${locale}/${entry.slug}`;
    void this.router.navigateByUrl(target);
  }

  protected selectRecent(query: string): void {
    this.store.setQuery(query);
    this.searchInput()?.nativeElement.focus();
  }

  protected openDialog(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [SEARCH_QUERY_PARAM]: '1' },
      queryParamsHandling: 'merge',
    });
  }

  protected close(): void {
    this.store.reset();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [SEARCH_QUERY_PARAM]: null },
      queryParamsHandling: 'merge',
    });
  }

  private loadRecent(locale: LocaleCode): void {
    try {
      const raw = localStorage.getItem(`${RECENT_STORAGE_PREFIX}${locale}`);
      this.recent.set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      this.recent.set([]);
    }
  }

  private saveRecent(locale: LocaleCode, query: string): void {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const next = [trimmed, ...this.recent().filter((entry) => entry !== trimmed)].slice(0, MAX_RECENT);
    this.recent.set(next);
    localStorage.setItem(`${RECENT_STORAGE_PREFIX}${locale}`, JSON.stringify(next));
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialogRoot()?.nativeElement;
    if (!root) {
      return;
    }
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
