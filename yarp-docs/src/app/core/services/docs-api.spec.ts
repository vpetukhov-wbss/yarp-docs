import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DocsApiService } from './docs-api';

describe('DocsApiService', () => {
  let service: DocsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(DocsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the nav tree with locale as a path segment, not a query string', () => {
    service.getNavTree('bg').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/nav/'));
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toContain('/nav/bg');
    expect(req.request.url).not.toContain('?');
    req.flush({ locale: 'bg', groups: [], appendix: [] });
  });

  it('requests a page with locale and slug both as path segments', () => {
    service.getPage('en', 'yarp-overview').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/pages/'));
    expect(req.request.url).toContain('/pages/en/yarp-overview');
    expect(req.request.url).not.toContain('?');
    req.flush({});
  });

  it('requests the search index scoped to a single locale path segment', () => {
    service.getSearchIndex('zh-Hans').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/search-index/'));
    expect(req.request.url).toContain('/search-index/zh-Hans');
    req.flush([]);
  });
});
