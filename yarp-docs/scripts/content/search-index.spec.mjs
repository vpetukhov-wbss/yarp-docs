import { buildSearchEntries } from './search-index.mjs';

function makePage(overrides = {}) {
  return {
    slug: 'load-balancing',
    locale: 'en',
    group: 'traffic-reliability',
    title: 'Load balancing',
    lede: 'How YARP picks a destination for each request.',
    headings: [
      { id: 'policies', text: 'Policies', level: 2 },
      { id: 'round-robin', text: 'Round robin', level: 3 },
      { id: 'configuration', text: 'Configuration', level: 2 },
    ],
    bodyHtml:
      '<h2 id="policies">Policies</h2><p>YARP ships several built-in policies for picking a destination.</p>' +
      '<h3 id="round-robin">Round robin</h3><p>Cycles through destinations in order, using <code>ILoadBalancingPolicy</code>.</p>' +
      '<h2 id="configuration">Configuration</h2><p>Set <code>LoadBalancingPolicy</code> on a cluster.</p>',
    ...overrides,
  };
}

describe('buildSearchEntries', () => {
  it('produces one page-level entry with the lede as its excerpt, distinct from the title', () => {
    const [pageEntry] = buildSearchEntries(makePage());
    expect(pageEntry).toMatchObject({
      slug: 'load-balancing',
      locale: 'en',
      group: 'traffic-reliability',
      title: 'Load balancing',
      excerpt: 'How YARP picks a destination for each request.',
    });
    expect(pageEntry.excerpt).not.toBe(pageEntry.title);
    expect(pageEntry.anchor).toBeUndefined();
  });

  it('produces one entry per heading with a locale-invariant anchor and a Page › Section headingPath', () => {
    const entries = buildSearchEntries(makePage());
    expect(entries).toHaveLength(4); // 1 page-level + 3 headings

    const policies = entries.find((e) => e.anchor === 'policies');
    expect(policies.headingPath).toBe('Load balancing › Policies');

    const roundRobin = entries.find((e) => e.anchor === 'round-robin');
    expect(roundRobin.headingPath).toBe('Load balancing › Policies › Round robin');

    const configuration = entries.find((e) => e.anchor === 'configuration');
    // A new h2 pops the h3 off the path stack, not nests under it.
    expect(configuration.headingPath).toBe('Load balancing › Configuration');
  });

  it('extracts an excerpt from each section’s own prose, trimmed of tags', () => {
    const entries = buildSearchEntries(makePage());
    const policies = entries.find((e) => e.anchor === 'policies');
    expect(policies.excerpt).toBe('YARP ships several built-in policies for picking a destination.');
  });

  it('derives per-section keywords from short inline <code> spans, deduped with frontmatter keywords', () => {
    const entries = buildSearchEntries(makePage(), ['LoadBalancingPolicy']);
    const roundRobin = entries.find((e) => e.anchor === 'round-robin');
    expect(roundRobin.keywords).toContain('ILoadBalancingPolicy');
    expect(roundRobin.keywords).toContain('LoadBalancingPolicy'); // page-level keyword still present
  });

  it('omits the keywords field entirely when there are none, rather than an empty array', () => {
    const page = makePage({ headings: [], bodyHtml: '<p>no headings, no code</p>' });
    const [pageEntry] = buildSearchEntries(page);
    expect(pageEntry.keywords).toBeUndefined();
  });
});
