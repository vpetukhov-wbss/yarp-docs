import { createPageRenderer, UnknownDocLinkError } from './markdown.mjs';

const DOC_BODY_STRINGS = {
  copyCode: 'Copy code',
  calloutNote: 'Note',
  calloutImportant: 'Important',
  calloutTip: 'Tip',
  seeAlso: 'See also',
  langOutput: 'Output',
  langConsole: 'Console',
};

function makeRenderer(overrides = {}) {
  return createPageRenderer({
    locale: 'en',
    slug: 'test-page',
    docBodyStrings: DOC_BODY_STRINGS,
    resolveDocTitle: (slug) => (slug === 'known-page' ? 'Known Page' : null),
    ...overrides,
  });
}

describe('createPageRenderer - headings', () => {
  it('uses an authored {#id} and strips it from the visible heading text', () => {
    const { bodyHtml, headings } = makeRenderer().render('## Path transforms {#path-transforms}\n\nSome text.\n');
    expect(bodyHtml).toContain('<h2 id="path-transforms">Path transforms</h2>');
    expect(bodyHtml).not.toContain('{#path-transforms}');
    expect(headings).toEqual([{ id: 'path-transforms', text: 'Path transforms', level: 2 }]);
  });

  it('falls back to a slugified id when no {#id} is authored', () => {
    const { headings } = makeRenderer().render('## Hello World\n\nSome text.\n');
    expect(headings).toEqual([{ id: 'hello-world', text: 'Hello World', level: 2 }]);
  });

  it('dedupes fallback ids that would otherwise collide', () => {
    const { headings } = makeRenderer().render('## Configuration\n\nA.\n\n## Configuration\n\nB.\n');
    expect(headings.map((h) => h.id)).toEqual(['configuration', 'configuration-2']);
  });

  it('renders h2 and h3 with their own levels', () => {
    const { headings } = makeRenderer().render('## Top {#top}\n\n### Sub {#sub}\n\ntext\n');
    expect(headings).toEqual([
      { id: 'top', text: 'Top', level: 2 },
      { id: 'sub', text: 'Sub', level: 3 },
    ]);
  });
});

describe('createPageRenderer - callouts', () => {
  it('renders a note as a plain .callout with the localized label', () => {
    const { bodyHtml } = makeRenderer().render(':::note\nSomething to know.\n:::\n');
    expect(bodyHtml).toContain('<div class="callout">');
    expect(bodyHtml).toContain('<div class="head">Note</div>');
    expect(bodyHtml).toContain('<p>Something to know.</p>');
    expect(bodyHtml).not.toContain('callout-note'); // no such class - plain .callout is the note styling
  });

  it('renders important/tip with the extra severity class and the right label', () => {
    const important = makeRenderer().render(':::important\nBe careful.\n:::\n').bodyHtml;
    expect(important).toContain('<div class="callout callout-important">');
    expect(important).toContain('<div class="head">Important</div>');

    const tip = makeRenderer().render(':::tip\nA shortcut.\n:::\n').bodyHtml;
    expect(tip).toContain('<div class="callout callout-tip">');
    expect(tip).toContain('<div class="head">Tip</div>');
  });

  it('renders inline formatting inside a callout', () => {
    const { bodyHtml } = makeRenderer().render(':::note\nUse **bold** and `code`.\n:::\n');
    expect(bodyHtml).toContain('<strong>bold</strong>');
    expect(bodyHtml).toContain('<code>code</code>');
  });
});

describe('createPageRenderer - example boxes and code blocks', () => {
  it('wraps a titled example in .example-box with an .eb-head and one pane per fence', () => {
    const md = ':::example Quick example\nA short description.\n\n```csharp\nvar x = 1;\n```\n\n```json\n{}\n```\n:::\n';
    const { bodyHtml } = makeRenderer().render(md);
    expect(bodyHtml).toContain('<div class="example-box">');
    expect(bodyHtml).toContain('<h3>Quick example</h3>');
    expect(bodyHtml).toContain('<p>A short description.</p>');
    expect((bodyHtml.match(/<pre class="code-block">/g) ?? []).length).toBe(2);
    expect(bodyHtml).not.toContain('code-block standalone');
  });

  it('gives a fence outside any example box the standalone class and a full id/copy button', () => {
    const { bodyHtml } = makeRenderer().render('```csharp\nvar x = 1;\n```\n');
    expect(bodyHtml).toContain('<pre class="code-block standalone">');
    expect(bodyHtml).toContain('data-copy="test-page-code-1"');
    expect(bodyHtml).toContain('id="test-page-code-1"');
    expect(bodyHtml).toContain('aria-label="Copy code"');
  });

  it('numbers code blocks sequentially per page, across both standalone and boxed fences', () => {
    const md = '```csharp\nvar a = 1;\n```\n\n:::example Title\ndesc\n\n```json\n{}\n```\n:::\n\n```bash\necho hi\n```\n';
    const { bodyHtml } = makeRenderer().render(md);
    expect(bodyHtml).toContain('id="test-page-code-1"');
    expect(bodyHtml).toContain('id="test-page-code-2"');
    expect(bodyHtml).toContain('id="test-page-code-3"');
  });

  it('maps known fence languages to their display tag', () => {
    const html = makeRenderer().render('```dotnetcli\ndotnet run\n```\n').bodyHtml;
    expect(html).toContain('<span class="lang-tag">.NET CLI</span>');
  });

  it('uses the localized docBody string for output/console fences', () => {
    const html = makeRenderer({
      docBodyStrings: { ...DOC_BODY_STRINGS, langOutput: 'Ausgabe' },
    }).render('```output\nHello\n```\n').bodyHtml;
    expect(html).toContain('<span class="lang-tag">Ausgabe</span>');
  });
});

describe('createPageRenderer - doc: links', () => {
  it('resolves a doc: link to a locale-prefixed href using the resolved title as link text', () => {
    const { bodyHtml } = makeRenderer().render('See [Known Page](doc:known-page) for details.\n');
    expect(bodyHtml).toContain('<a href="/en/known-page">Known Page</a>');
  });

  it('carries an anchor through to the href', () => {
    const { bodyHtml } = makeRenderer().render('See [it](doc:known-page#some-heading).\n');
    expect(bodyHtml).toContain('<a href="/en/known-page#some-heading">it</a>');
  });

  it('throws UnknownDocLinkError for a doc: link to an unresolvable slug', () => {
    expect(() => makeRenderer().render('See [nope](doc:totally-unknown-slug).\n')).toThrow(UnknownDocLinkError);
  });

  it('opens external http(s) links in a new tab with rel=noopener', () => {
    const { bodyHtml } = makeRenderer().render('See [Learn](https://learn.microsoft.com/x).\n');
    expect(bodyHtml).toContain('<a href="https://learn.microsoft.com/x" target="_blank" rel="noopener">Learn</a>');
  });
});

describe('createPageRenderer - lists and tables', () => {
  it('renders a bullet list', () => {
    const { bodyHtml } = makeRenderer().render('- one\n- two\n');
    expect(bodyHtml).toContain('<ul>');
    expect(bodyHtml).toContain('<li>one</li>');
    expect(bodyHtml).toContain('<li>two</li>');
  });

  it('renders a GFM table wrapped in .table-wrap', () => {
    const md = '| Key | Value |\n| --- | --- |\n| A | 1 |\n';
    const { bodyHtml } = makeRenderer().render(md);
    expect(bodyHtml).toContain('<div class="table-wrap"><table>');
    expect(bodyHtml).toContain('<th>Key</th>');
    expect(bodyHtml).toContain('<td>A</td>');
  });
});
