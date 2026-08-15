// Markdown -> DocPage bodyHtml/headings, via a fresh `Marked` instance per
// page (see createPageRenderer). A fresh instance per call keeps every
// piece of per-page state (the code-block counter, the collected headings
// array, the explicit-heading-id queue) in that call's own closure instead
// of module-level mutable state - required for the compiler's idempotence
// guarantee (run twice, byte-identical output) and for safe parallel page
// rendering.
import { Marked } from 'marked';

import { escapeHtml, highlightCode } from './highlight.mjs';

// Fence info string -> { grammarKey (highlight.mjs's GRAMMARS key, or null
// for "don't tokenize"), display (the visible .lang-tag text, or a
// docBody.* i18n key for the two that are plain English UI words rather
// than a language/product name).
const FENCE_LANG = {
  csharp: { grammarKey: 'csharp', display: 'C#' },
  json: { grammarKey: 'json', display: 'JSON' },
  xml: { grammarKey: 'markup', display: 'XML' },
  dotnetcli: { grammarKey: 'bash', display: '.NET CLI' },
  bash: { grammarKey: 'bash', display: 'Bash' },
  powershell: { grammarKey: 'powershell', display: 'PowerShell' },
  yaml: { grammarKey: 'yaml', display: 'YAML' },
  output: { grammarKey: null, i18nKey: 'langOutput' },
  console: { grammarKey: null, i18nKey: 'langConsole' },
};

const HEADING_ID_RE = /^(#{2,3}\s+.*?)\s*\{#([\w-]+)\}[ \t]*$/gm;

const COPY_SVG =
  '<svg class="copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
  '<rect x="9" y="9" width="12" height="12" rx="2"/>' +
  '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
  '</svg>' +
  '<svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path d="M20 6 9 17l-5-5"/>' +
  '</svg>';

const CALLOUT_ICONS = {
  note: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  important:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  tip: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.472V15h8v-2.528A6 6 0 0 0 12 2Z"/></svg>',
};

const CONTAINER_RE = /^:::(note|important|tip|example)([^\n]*)\n([\s\S]*?)\n:::(?:\n+|$)/;

function alignAttr(align) {
  return align ? ` style="text-align:${align}"` : '';
}

export class UnknownDocLinkError extends Error {
  constructor(targetSlug, fromSlug) {
    super(`doc: link to unknown slug "${targetSlug}" in ${fromSlug}`);
    this.targetSlug = targetSlug;
    this.fromSlug = fromSlug;
  }
}

// docBodyStrings: the target locale's docBody.* i18n values (calloutNote/
// calloutImportant/calloutTip/langOutput/langConsole/copyCode) - read by
// render-page.mjs from public/assets/i18n/{locale}.json, not by this
// module, which has no filesystem access of its own.
// resolveDocTitle(slug): returns that slug's title IN THIS LOCALE, or null
// if the slug doesn't exist - null makes a `doc:` link a hard build error
// (UnknownDocLinkError) rather than a silently dead link.
export function createPageRenderer({ locale, slug, docBodyStrings, resolveDocTitle }) {
  let codeBlockCounter = 0;
  const headings = [];
  const explicitIds = [];

  function nextCodeBlockId() {
    codeBlockCounter += 1;
    return `${slug}-code-${codeBlockCounter}`;
  }

  function renderCodeBlock(code, fenceLang, { standalone }) {
    const id = nextCodeBlockId();
    const langInfo = FENCE_LANG[fenceLang];
    const displayTag = langInfo ? (langInfo.i18nKey ? docBodyStrings[langInfo.i18nKey] : langInfo.display) : fenceLang || 'Text';
    const html = langInfo ? highlightCode(code, langInfo.grammarKey) : escapeHtml(code);
    const cls = standalone ? 'code-block standalone' : 'code-block';
    return (
      `<pre class="${cls}"><span class="lang-tag">${escapeHtml(displayTag)}</span>` +
      `<button class="copy-btn" data-copy="${id}" aria-label="${escapeHtml(docBodyStrings.copyCode)}">${COPY_SVG}</button>` +
      `<code id="${id}">${html}</code></pre>`
    );
  }

  const marked = new Marked({
    gfm: true,
    hooks: {
      // Strips the authored `{#id}` suffix from every h2/h3 line before
      // marked ever sees it (so it never leaks into visible heading text),
      // recording each id in document order. The heading renderer below
      // dequeues them 1:1, in the same left-to-right order marked visits
      // heading tokens for a top-level, non-nested document - headings
      // never appear inside a :::container in this content model, so
      // there's no reordering risk to guard against.
      preprocess(markdown) {
        return markdown.replace(HEADING_ID_RE, (_full, headingWithoutId, id) => {
          explicitIds.push(id);
          return headingWithoutId;
        });
      },
    },
    renderer: {
      heading(token) {
        const text = this.parser.parseInline(token.tokens);
        const plainText = token.text;
        const id = explicitIds.shift() ?? slugifyFallback(plainText, headings);
        headings.push({ id, text: plainText, level: token.depth });
        return `<h${token.depth} id="${id}">${text}</h${token.depth}>`;
      },
      code(token) {
        return renderCodeBlock(token.text, token.lang, { standalone: true });
      },
      link(token) {
        const text = this.parser.parseInline(token.tokens);
        if (token.href.startsWith('doc:')) {
          const [targetSlug, anchor] = token.href.slice(4).split('#');
          const targetTitle = resolveDocTitle(targetSlug);
          if (targetTitle === null) {
            throw new UnknownDocLinkError(targetSlug, slug);
          }
          const href = `/${locale}/${targetSlug}${anchor ? `#${anchor}` : ''}`;
          return `<a href="${href}">${text}</a>`;
        }
        const external = /^https?:\/\//.test(token.href);
        const rel = external ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${escapeHtml(token.href)}"${rel}>${text}</a>`;
      },
      // Wrapped in .table-wrap - doc-body.scss's table styling (added in
      // this same pass) expects that wrapper for the card border/radius and
      // independent horizontal scroll; marked's own default table renderer
      // emits a bare <table> with no wrapper at all.
      table(token) {
        const headerCells = token.header
          .map((cell, i) => `<th${alignAttr(token.align[i])}>${this.parser.parseInline(cell.tokens)}</th>`)
          .join('');
        const bodyRows = token.rows
          .map(
            (row) =>
              `<tr>${row.map((cell, i) => `<td${alignAttr(token.align[i])}>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`,
          )
          .join('');
        return (
          `<div class="table-wrap"><table><thead><tr>${headerCells}</tr></thead>` +
          `<tbody>${bodyRows}</tbody></table></div>`
        );
      },
    },
    extensions: [
      {
        name: 'container',
        level: 'block',
        start(src) {
          const index = src.indexOf(':::');
          return index === -1 ? undefined : index;
        },
        tokenizer(src) {
          const match = CONTAINER_RE.exec(src);
          if (!match) {
            return undefined;
          }
          const [raw, kind, titleLine, body] = match;
          const titleText = titleLine.trim();
          return {
            type: 'container',
            raw,
            kind,
            // Inline-tokenized up front (tokenizer time, when this.lexer is
            // available) so a title can carry inline formatting like `code`;
            // rendered later via parser.parseInline.
            titleTokens: titleText ? this.lexer.inlineTokens(titleText) : null,
            tokens: this.lexer.blockTokens(body, []),
          };
        },
        renderer(token) {
          if (token.kind === 'example') {
            return renderExampleBox(token, this.parser);
          }
          return renderCallout(token, this.parser, docBodyStrings);
        },
      },
    ],
  });

  function renderExampleBox(token, parser) {
    const codeTokens = token.tokens.filter((t) => t.type === 'code');
    const descriptionTokens = token.tokens.filter((t) => t.type !== 'code');
    const titleHtml = token.titleTokens ? `<h3>${parser.parseInline(token.titleTokens)}</h3>` : '';
    const descriptionHtml = descriptionTokens.length ? parser.parse(descriptionTokens) : '';
    const panes = codeTokens.map((t) => renderCodeBlock(t.text, t.lang, { standalone: false })).join('');
    return `<div class="example-box"><div class="eb-head">${titleHtml}${descriptionHtml}</div>${panes}</div>`;
  }

  function renderCallout(token, parser, strings) {
    const cls = token.kind === 'note' ? 'callout' : `callout callout-${token.kind}`;
    const labelKey = `callout${token.kind[0].toUpperCase()}${token.kind.slice(1)}`; // note -> calloutNote
    const label = strings[labelKey];
    const body = parser.parse(token.tokens);
    return `<div class="${cls}">${CALLOUT_ICONS[token.kind]}<div><div class="head">${escapeHtml(label)}</div>${body}</div></div>`;
  }

  return {
    // Renders the page body (frontmatter already stripped by the caller)
    // and returns both the HTML and the headings[] array collected as a
    // side effect of rendering - the two are produced together so they can
    // never drift out of sync with each other.
    render(markdownBody) {
      const bodyHtml = marked.parse(markdownBody);
      return { bodyHtml, headings: [...headings] };
    },
  };
}

// Fallback only - every English page's h2/h3 is expected to carry an
// authored {#id}; this only fires for a heading the author forgot to tag,
// and validate.mjs treats any auto-generated id as an authoring error
// rather than silently accepting it (a translated file never reaches this
// path at all, since its ids get transplanted from English afterward - see
// render-page.mjs).
function slugifyFallback(text, existingHeadings) {
  const base =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || `section-${existingHeadings.length + 1}`;
  let candidate = base;
  let suffix = 1;
  while (existingHeadings.some((h) => h.id === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
