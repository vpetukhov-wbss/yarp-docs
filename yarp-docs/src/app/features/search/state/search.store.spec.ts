import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { SearchIndexEntry } from '../../../core/models/search-entry.model';
import { SearchStore } from './search.store';

const ENTRIES: SearchIndexEntry[] = [
  {
    slug: 'load-balancing',
    locale: 'en',
    group: 'traffic-reliability',
    title: 'Load balancing',
    excerpt: 'Distributes traffic across destinations.',
  },
  {
    slug: 'session-affinity',
    locale: 'en',
    group: 'traffic-reliability',
    title: 'Session affinity',
    excerpt: 'Keeps a client on the same destination.',
  },
];

// The debounce (180ms) is exercised with a real wait rather than fake
// timers - simpler to keep reliable than getting RxJS's async scheduler and
// Vitest's timer mocking to agree, and the extra time is negligible here.
const DEBOUNCE_WAIT_MS = 250;
const settle = () => new Promise((resolve) => setTimeout(resolve, DEBOUNCE_WAIT_MS));

describe('SearchStore', () => {
  let store: InstanceType<typeof SearchStore>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideZonelessChangeDetection(), SearchStore],
    });
    store = TestBed.inject(SearchStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function loadFixtureIndex(): void {
    store.loadIndex('en');
    httpMock.expectOne((r) => r.url.includes('/search-index/en')).flush(ENTRIES);
  }

  it('fetches the search index scoped to locale and tracks loading -> success', () => {
    store.loadIndex('en');
    const req = httpMock.expectOne((r) => r.url.includes('/search-index/en'));
    expect(store.indexStatus()).toBe('loading');

    req.flush(ENTRIES);
    expect(store.indexStatus()).toBe('success');
    expect(store.indexLocale()).toBe('en');
  });

  it('marks the index errored on a failed fetch', () => {
    store.loadIndex('en');
    const req = httpMock.expectOne((r) => r.url.includes('/search-index/en'));

    req.flush('server error', { status: 500, statusText: 'Server Error' });
    expect(store.indexStatus()).toBe('error');
  });

  it('returns matching entries for a query, after the debounce settles', async () => {
    loadFixtureIndex();

    store.setQuery('load');
    expect(store.results()).toEqual([]); // still debouncing

    await settle();
    expect(store.results().map((entry) => entry.slug)).toEqual(['load-balancing']);
  });

  it('does not search below the minimum query length', async () => {
    loadFixtureIndex();

    store.setQuery('l');
    await settle();
    expect(store.results()).toEqual([]);
  });

  it('wraps the highlighted index in both directions', async () => {
    loadFixtureIndex();

    // Both fixture excerpts contain "destination(s)".
    store.setQuery('destination');
    await settle();
    expect(store.results().length).toBe(2);
    expect(store.highlightedIndex()).toBe(0);

    store.moveHighlight(-1);
    expect(store.highlightedIndex()).toBe(1);

    store.moveHighlight(1);
    expect(store.highlightedIndex()).toBe(0);
  });

  it('reset clears query, results, and highlight', async () => {
    loadFixtureIndex();

    store.setQuery('load');
    await settle();
    expect(store.results().length).toBeGreaterThan(0);

    store.reset();
    expect(store.query()).toBe('');
    expect(store.results()).toEqual([]);
    expect(store.highlightedIndex()).toBe(0);
  });
});
