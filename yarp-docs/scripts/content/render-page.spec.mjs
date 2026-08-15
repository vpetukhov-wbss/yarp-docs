import { splitFrontmatter, transplantHeadingIds } from './render-page.mjs';

describe('splitFrontmatter', () => {
  it('parses YAML frontmatter and returns the remaining body separately', () => {
    const raw = '---\nslug: foo\ntitle: Foo\n---\n\n## Heading\n\nBody text.\n';
    const { frontmatter, body } = splitFrontmatter(raw, 'foo.md');
    expect(frontmatter).toEqual({ slug: 'foo', title: 'Foo' });
    expect(body.trim()).toBe('## Heading\n\nBody text.');
  });

  it('throws a clear error when the leading --- block is missing', () => {
    expect(() => splitFrontmatter('## Heading\n\nNo frontmatter here.\n', 'bad.md')).toThrow(/frontmatter/i);
  });

  it('parses list and multi-line (folded) scalar frontmatter values', () => {
    const raw = '---\nslug: foo\nlede: >-\n  A folded\n  sentence.\nseeAlso: [a, b, c]\n---\nBody.\n';
    const { frontmatter } = splitFrontmatter(raw, 'foo.md');
    expect(frontmatter.lede).toBe('A folded sentence.');
    expect(frontmatter.seeAlso).toEqual(['a', 'b', 'c']);
  });
});

describe('transplantHeadingIds', () => {
  const englishHeadings = [
    { id: 'policies', text: 'Policies', level: 2 },
    { id: 'configuration', text: 'Configuration', level: 2 },
  ];

  it('rewrites both the headings array and the inline id="..." attributes to the English ids', () => {
    const translatedHeadings = [
      { id: 'richtlinien', text: 'Richtlinien', level: 2 },
      { id: 'konfiguration', text: 'Konfiguration', level: 2 },
    ];
    const bodyHtml = '<h2 id="richtlinien">Richtlinien</h2><p>x</p><h2 id="konfiguration">Konfiguration</h2><p>y</p>';

    const result = transplantHeadingIds(bodyHtml, translatedHeadings, englishHeadings, 'load-balancing');

    expect(result.headings).toEqual([
      { id: 'policies', text: 'Richtlinien', level: 2 },
      { id: 'configuration', text: 'Konfiguration', level: 2 },
    ]);
    expect(result.bodyHtml).toBe('<h2 id="policies">Richtlinien</h2><p>x</p><h2 id="configuration">Konfiguration</h2><p>y</p>');
  });

  it('throws when the translated page has a different number of headings than English', () => {
    const translatedHeadings = [{ id: 'x', text: 'X', level: 2 }];
    expect(() => transplantHeadingIds('<h2 id="x">X</h2>', translatedHeadings, englishHeadings, 'some-slug')).toThrow(
      /heading count mismatch/i,
    );
  });

  it('throws when a heading level differs between the translated page and English', () => {
    const translatedHeadings = [
      { id: 'a', text: 'A', level: 3 }, // English has level 2 here
      { id: 'b', text: 'B', level: 2 },
    ];
    const bodyHtml = '<h3 id="a">A</h3><h2 id="b">B</h2>';
    expect(() => transplantHeadingIds(bodyHtml, translatedHeadings, englishHeadings, 'some-slug')).toThrow(/heading level mismatch/i);
  });
});
