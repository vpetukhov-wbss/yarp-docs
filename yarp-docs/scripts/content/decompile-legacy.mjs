// Reverse-compiler: public/assets/mock-api/v1/pages/en/<slug>.json (bodyHtml)
// -> content/en/<slug>.md, undoing exactly what scripts/content/markdown.mjs
// does. Validated by round-tripping an already-migrated slug (yarp-overview):
// decompile(compile(X)) must equal X (modulo whitespace).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = 'd:/DOWNLOADS/YARP/yarp-docs';
const PAGES_ROOT = join(ROOT, 'public/assets/mock-api/v1/pages');
const CONTENT_ROOT = join(ROOT, 'content');

const i18nCache = new Map();
function docBodyFor(locale) {
  if (!i18nCache.has(locale)) {
    const i18n = JSON.parse(readFileSync(join(ROOT, 'public/assets/i18n', `${locale}.json`), 'utf8'));
    i18nCache.set(locale, i18n.docBody);
  }
  return i18nCache.get(locale);
}

function fenceMapFor(locale) {
  const docBody = docBodyFor(locale);
  return {
    'C#': 'csharp',
    JSON: 'json',
    XML: 'xml',
    '.NET CLI': 'dotnetcli',
    Bash: 'bash',
    PowerShell: 'powershell',
    YAML: 'yaml',
    [docBody.langOutput]: 'output',
    [docBody.langConsole]: 'console',
  };
}

function unescapeHtml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

// Inline content of a <code id="..."> block: tok-* spans wrap text only
// (highlight.mjs's round-trip invariant), so textContent recovers the exact
// original code bytes after HTML-unescaping.
function codeBlockToFence(preEl, fenceMap) {
  const langTag = preEl.querySelector('.lang-tag').textContent.trim();
  const fenceLang = fenceMap[langTag] ?? langTag.toLowerCase();
  const codeEl = preEl.querySelector('code');
  const code = codeEl.textContent;
  return `\`\`\`${fenceLang}\n${code}\n\`\`\``;
}

function inline(node, doc) {
  let out = '';
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      out += child.textContent;
    } else if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'strong') out += `**${inline(child, doc)}**`;
      else if (tag === 'em') out += `*${inline(child, doc)}*`;
      else if (tag === 'code') out += `\`${child.textContent}\``;
      else if (tag === 'a') {
        const href = child.getAttribute('href');
        const text = inline(child, doc);
        let mdHref = href;
        if (href.startsWith('/')) {
          const parts = href.slice(1).split('/'); // [locale, slug#anchor?]
          const rest = parts.slice(1).join('/');
          const [slug, anchor] = rest.split('#');
          mdHref = `doc:${slug}${anchor ? `#${anchor}` : ''}`;
        }
        out += `[${text}](${mdHref})`;
      } else {
        out += inline(child, doc);
      }
    }
  }
  return out;
}

// includeHeadingIds: true only for content/en/*.md - translated files must
// not carry {#id} at all, since the compiler transplants English ids onto
// translated headings by position (see content/README.md).
function blocksToMarkdown(container, doc, fenceMap, includeHeadingIds) {
  const parts = [];
  for (const el of container.children) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h2' || tag === 'h3') {
      const level = tag === 'h2' ? '##' : '###';
      const id = el.getAttribute('id');
      const suffix = includeHeadingIds ? ` {#${id}}` : '';
      parts.push(`${level} ${inline(el, doc)}${suffix}`);
    } else if (tag === 'p') {
      parts.push(inline(el, doc));
    } else if (tag === 'ul' || tag === 'ol') {
      const marker = tag === 'ul' ? '-' : '1.';
      const items = [...el.children].map((li) => `${marker} ${inline(li, doc)}`);
      parts.push(items.join('\n'));
    } else if (tag === 'div' && el.classList.contains('table-wrap')) {
      const table = el.querySelector('table');
      const headCells = [...table.querySelectorAll('thead th')];
      const header = `| ${headCells.map((c) => inline(c, doc)).join(' | ')} |`;
      const sep = `| ${headCells.map(() => '---').join(' | ')} |`;
      const rows = [...table.querySelectorAll('tbody tr')].map(
        (tr) => `| ${[...tr.children].map((c) => inline(c, doc)).join(' | ')} |`,
      );
      parts.push([header, sep, ...rows].join('\n'));
    } else if (tag === 'pre' && el.classList.contains('code-block')) {
      parts.push(codeBlockToFence(el, fenceMap));
    } else if (tag === 'div' && el.classList.contains('example-box')) {
      const head = el.querySelector('.eb-head');
      const h3 = head.querySelector('h3');
      const title = h3 ? inline(h3, doc) : '';
      const descEls = [...head.children].filter((c) => c.tagName.toLowerCase() !== 'h3');
      const descMd = descEls.map((p) => inline(p, doc)).join('\n\n');
      const codeBlocks = [...el.querySelectorAll(':scope > pre.code-block')].map((pre) => codeBlockToFence(pre, fenceMap));
      const body = [descMd, ...codeBlocks].filter(Boolean).join('\n\n');
      parts.push(`:::example ${title}\n${body}\n:::`);
    } else if (tag === 'div' && el.classList.contains('callout')) {
      const kind = el.classList.contains('callout-important')
        ? 'important'
        : el.classList.contains('callout-tip')
          ? 'tip'
          : 'note';
      const inner = el.children[1]; // <div><div class="head">LABEL</div>BODY...</div>
      const bodyEls = [...inner.children].filter((c) => !c.classList.contains('head'));
      const bodyMd = blocksToMarkdown({ children: bodyEls }, doc, fenceMap, includeHeadingIds);
      parts.push(`:::${kind}\n${bodyMd}\n:::`);
    } else {
      throw new Error(`Unhandled top-level tag: ${tag} (class="${el.className}")`);
    }
  }
  return parts.join('\n\n');
}

function extractSeeAlso(container) {
  // Trailing <h2 id="see-also">SeeAlso</h2><ul><li><a href="/en/slug">..</a></li>...</ul>
  const children = [...container.children];
  const idx = children.findIndex((el) => el.tagName.toLowerCase() === 'h2' && el.getAttribute('id') === 'see-also');
  if (idx === -1) return { seeAlso: null, trimmed: container };
  const ul = children[idx + 1];
  const slugs = [...ul.querySelectorAll('a')].map((a) => a.getAttribute('href').split('/').pop());
  const dom = new JSDOM('<div id="root"></div>');
  const root = dom.window.document.getElementById('root');
  children.slice(0, idx).forEach((c) => root.appendChild(c.cloneNode(true)));
  return { seeAlso: slugs, trimmed: root };
}

function wrapText(text, width) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && (line.length + 1 + word.length) > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function yamlEscape(value) {
  if (value.includes(':') || value.includes('#') || value.startsWith(' ') || value.endsWith(' ')) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function readPageJson(locale, slug, { gitRef } = {}) {
  if (gitRef) {
    const path = `yarp-docs/public/assets/mock-api/v1/pages/${locale}/${slug}.json`;
    const raw = execFileSync('git', ['show', `${gitRef}:${path}`], { cwd: 'd:/DOWNLOADS/YARP', encoding: 'utf8' });
    return JSON.parse(raw);
  }
  return JSON.parse(readFileSync(join(PAGES_ROOT, locale, `${slug}.json`), 'utf8'));
}

export function decompileSlug(slug, { locale = 'en', outDir, write = true, gitRef } = {}) {
  const resolvedOutDir = outDir ?? join(CONTENT_ROOT, locale);
  const page = readPageJson(locale, slug, { gitRef });
  const dom = new JSDOM(`<div id="root">${page.bodyHtml}</div>`);
  const root = dom.window.document.getElementById('root');
  const { seeAlso, trimmed } = extractSeeAlso(root);
  const fenceMap = fenceMapFor(locale);
  const bodyMd = blocksToMarkdown(trimmed, dom.window.document, fenceMap, locale === 'en');

  const fm = [
    '---',
    `slug: ${slug}`,
    `title: ${yamlEscape(page.title)}`,
    `lede: >-`,
    ...wrapText(page.lede, 96).map((line) => `  ${line}`),
    `sourceUrl: ${page.sourceUrl}`,
    `lastUpdated: ${page.lastUpdated}`,
  ];
  if (seeAlso?.length) fm.push(`seeAlso: [${seeAlso.join(', ')}]`);
  fm.push('---', '');

  const md = `${fm.join('\n')}\n${bodyMd}\n`;
  if (write) {
    writeFileSync(join(resolvedOutDir, `${slug}.md`), md, 'utf8');
  }
  return md;
}

const args = process.argv.slice(2);
if (args[0] === '--validate') {
  const slug = args[1] || 'yarp-overview';
  const original = readFileSync(join(CONTENT_ROOT, 'en', `${slug}.md`), 'utf8');
  const rebuilt = decompileSlug(slug, { write: false });
  console.log('--- ORIGINAL ---');
  console.log(original);
  console.log('--- REBUILT ---');
  console.log(rebuilt);
  console.log('--- MATCH:', original.trim() === rebuilt.trim(), '---');
} else if (args[0] === '--restore') {
  // node decompile-legacy.mjs --restore <locale> <slug> <gitRef>
  const [, locale, slug, gitRef] = args;
  decompileSlug(slug, { locale, gitRef });
  console.log(`Wrote content/${locale}/${slug}.md (from ${gitRef})`);
} else if (args[0]) {
  decompileSlug(args[0], { locale: 'en' });
  console.log(`Wrote content/en/${args[0]}.md`);
} else {
  console.log('Usage: node decompile-legacy.mjs <slug> | --validate <slug> | --restore <locale> <slug> <gitRef>');
}
