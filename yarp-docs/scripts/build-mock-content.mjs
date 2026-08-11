#!/usr/bin/env node
// Turns the 36 source PDFs in the repo root into the mock-API fixture tree
// under public/assets/mock-api/v1/. Dev-time only - not part of `ng build`.
//
// Pipeline: pdftotext -layout each PDF -> strip Microsoft Learn's
// print-header/footer noise -> heuristically split into headings / code
// blocks / callouts / paragraphs -> emit a DocPage-shaped JSON file per
// (locale, slug) -> clone the English content into the other 8 locales with
// translated:false -> hand-flag a couple of pages translated:true so both
// TranslationBanner states exist in the fixture set -> emit nav/{locale}.json
// and search-index/{locale}.json to match.
//
// This will not be perfect - plain-text PDF extraction throws away all
// font/style information, so heading detection is a heuristic (a short,
// unpunctuated, blank-line-delimited line), and code blocks render without
// syntax-highlight spans (that would need an actual C#/JSON tokenizer, out
// of scope for provisional content). The output is committed and meant to
// be hand-reviewed and corrected, the same way the original PDF pipeline in
// the project plan was always scoped - not regenerated blindly on every run.
//
// Three pages (yarp-overview, getting-started, load-balancing) are skipped
// here: they were already hand-authored with real syntax-highlighted code
// and precisely chosen headings while building the doc-article screen, and
// are higher quality than this heuristic pipeline produces. Re-running this
// script will not overwrite them.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..'); // yarp-docs/scripts -> d:\DOWNLOADS\YARP
const OUTPUT_ROOT = join(__dirname, '..', 'public', 'assets', 'mock-api', 'v1');

// Must be kept in sync with src/app/core/locales.ts by hand - this is a
// plain Node script with no build step, so it can't import that file.
const LOCALES = ['en', 'bg', 'ru', 'fr', 'el', 'es', 'de', 'pt-BR', 'zh-Hans'];
const DEFAULT_LOCALE = 'en';

// A couple of pages per non-English locale get flagged translated:true (same
// English text, since real translation is out of scope for this pass - see
// the plan's "Out of scope") purely so both TranslationBanner states exist
// somewhere in the fixture set, not just in theory.
const MARK_TRANSLATED = [
  { locale: 'bg', slug: 'yarp-overview' },
  { locale: 'bg', slug: 'getting-started' },
  { locale: 'de', slug: 'yarp-overview' },
];

const SKIP_SLUGS = new Set(['yarp-overview', 'getting-started', 'load-balancing']);

const CODE_LANGUAGE_TAGS = new Set(['C#', 'JSON', '.NET CLI', 'XML', 'Output', 'Console']);

// The canonical IA - not derived from the PDFs (their filenames don't map
// cleanly to slugs or group structure), the same hand-verified structure
// already in nav/en.json since Step 7/10.
const GROUPS = [
  {
    id: 'getting-started',
    label: 'Getting started',
    items: [
      { slug: 'yarp-overview', title: 'Overview of YARP', pdf: 'Overview of YARP _ Microsoft Learn.pdf' },
      { slug: 'getting-started', title: 'Getting started', pdf: 'YARP Getting Started with YARP _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      { slug: 'config-files', title: 'Configuration files', pdf: 'YARP Configuration Files _ Microsoft Learn.pdf' },
      { slug: 'config-filters', title: 'Configuration filters', pdf: 'YARP Configuration Filters _ Microsoft Learn.pdf' },
      { slug: 'config-providers', title: 'Configuration providers', pdf: 'YARP Extensibility Configuration Providers _ Microsoft Learn.pdf' },
      { slug: 'http-client-config', title: 'HTTP client configuration', pdf: 'YARP HTTP Client Configuration _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'routing',
    label: 'Routing',
    items: [
      { slug: 'header-routing', title: 'Header-based routing', pdf: 'YARP Header Based Routing _ Microsoft Learn.pdf' },
      { slug: 'queryparameter-routing', title: 'Query parameter routing', pdf: 'YARP Query Parameter Based Routing _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'transforms',
    label: 'Transforms',
    items: [
      { slug: 'transforms', title: 'Overview', pdf: 'YARP Request and Response Transforms _ Microsoft Learn.pdf' },
      { slug: 'transforms-request', title: 'Request transforms', pdf: 'YARP Request Transforms _ Microsoft Learn.pdf' },
      { slug: 'transforms-response', title: 'Response & trailer transforms', pdf: 'YARP Response and Response Trailer Transforms _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'traffic-reliability',
    label: 'Traffic & reliability',
    items: [
      { slug: 'load-balancing', title: 'Load balancing', pdf: 'YARP Load Balancing _ Microsoft Learn.pdf' },
      { slug: 'session-affinity', title: 'Session affinity', pdf: 'YARP Session Affinity _ Microsoft Learn.pdf' },
      { slug: 'dests-health-checks', title: 'Destination health checks', pdf: 'YARP Destination health checks _ Microsoft Learn.pdf' },
      { slug: 'rate-limiting', title: 'Rate limiting', pdf: 'YARP Rate Limiting _ Microsoft Learn.pdf' },
      { slug: 'timeouts', title: 'Request timeouts', pdf: 'YARP Request Timeouts _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { slug: 'authn-authz', title: 'Authentication & authorization', pdf: 'YARP Authentication and Authorization _ Microsoft Learn.pdf' },
      { slug: 'cors', title: 'Cross-origin requests (CORS)', pdf: 'YARP Cross-Origin Requests (CORS) _ Microsoft Learn.pdf' },
      { slug: 'https-tls', title: 'HTTPS & TLS', pdf: 'YARP HTTPS & TLS _ Microsoft Learn.pdf' },
      { slug: 'header-guidelines', title: 'HTTP header guidelines', pdf: 'YARP HTTP header guidelines _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    items: [{ slug: 'output-caching', title: 'Output caching', pdf: 'YARP Output Caching _ Microsoft Learn.pdf' }],
  },
  {
    id: 'protocols',
    label: 'Protocols',
    items: [
      { slug: 'grpc', title: 'Proxying gRPC', pdf: 'YARP Proxying gRPC _ Microsoft Learn.pdf' },
      { slug: 'http3', title: 'HTTP/3', pdf: 'YARP HTTP_3 _ Microsoft Learn.pdf' },
      { slug: 'websockets', title: 'WebSockets & SPDY', pdf: 'YARP Proxying WebSockets and SPDY _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'extensibility',
    label: 'Extensibility',
    items: [
      { slug: 'extensibility', title: 'Overview', pdf: 'Overview of extensibility _ Microsoft Learn.pdf' },
      { slug: 'middleware', title: 'Middleware', pdf: 'YARP Middleware _ Microsoft Learn.pdf' },
      { slug: 'direct-forwarding', title: 'Direct forwarding', pdf: 'YARP Direct Forwarding _ Microsoft Learn.pdf' },
      { slug: 'destination-resolvers', title: 'Destination resolvers', pdf: 'YARP Extensibility Destination Resolvers _ Microsoft Learn.pdf' },
      { slug: 'extensibility-transforms', title: 'Request & response transforms', pdf: 'YARP Extensibility - Request and Response Transforms _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { slug: 'diagnosing-yarp-issues', title: 'Diagnosing YARP-based proxies', pdf: 'YARP Diagnosing YARP-based proxies _ Microsoft Learn.pdf' },
      { slug: 'distributed-tracing', title: 'Distributed tracing', pdf: 'YARP Distributed tracing _ Microsoft Learn.pdf' },
      { slug: 'ab-testing', title: 'A/B testing & rolling upgrades', pdf: 'YARP A_B Testing and Rolling Upgrades _ Microsoft Learn.pdf' },
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    items: [
      { slug: 'kubernetes-ingress', title: 'Kubernetes Ingress Controller', pdf: 'YARP Kubernetes Ingress Controller _ Microsoft Learn.pdf' },
      { slug: 'service-fabric-int', title: 'Service Fabric integration', pdf: 'YARP Service Fabric Integration _ Microsoft Learn.pdf' },
      { slug: 'httpsys-delegation', title: 'HTTP.sys delegation', pdf: 'YARP HTTP.sys Delegation _ Microsoft Learn.pdf' },
    ],
  },
];

const APPENDIX = [{ slug: 'aspnetcore-getting-started', title: 'Get started with ASP.NET Core', pdf: 'YARP.pdf', kind: 'appendix' }];

const SOURCE_URL_BASE = 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/';
const SOURCE_URL_SLUG_OVERRIDES = {
  'yarp-overview': 'yarp-overview',
  extensibility: 'extensibility',
  'aspnetcore-getting-started': '../../../getting-started', // outside the yarp/ tree entirely
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// A bare 'pdftotext' on PATH works when this script runs inside Git Bash/
// Linux/macOS, but a Windows-native `node` process spawning a child via
// execFileSync doesn't resolve Git for Windows' POSIX-style mingw64/bin PATH
// entry the same way the shell that ran `node` did - confirmed directly:
// `which pdftotext` succeeds in the Bash tool, but execFileSync('pdftotext')
// from that same shell's `node` fails to find it. Falling back to the known
// Git-for-Windows install location covers the common case without needing
// the user to fix PATH just to run this script.
const PDFTOTEXT_CANDIDATES = ['pdftotext', 'C:\\Program Files\\Git\\mingw64\\bin\\pdftotext.exe'];

function resolvePdftotext() {
  for (const candidate of PDFTOTEXT_CANDIDATES) {
    try {
      execFileSync(candidate, ['-v'], { stdio: 'pipe' });
      return candidate; // ran and exited 0
    } catch (error) {
      // poppler's `pdftotext -v` prints its version to stderr and still
      // exits non-zero by design - confirmed directly (it prints
      // "pdftotext version 4.00..." on both candidates, every time, exit
      // code notwithstanding). The only failure that actually means "not
      // found" is ENOENT (ran nothing at all); any other error means the
      // binary exists and is invokable, which is all this check needs.
      if (error.code !== 'ENOENT') {
        return candidate;
      }
    }
  }
  throw new Error(
    'pdftotext not found. Install poppler-utils (e.g. via Git for Windows\' mingw64/bin, ' +
      'or `apt-get install poppler-utils` / `brew install poppler`) before running this script.',
  );
}

function extractPdfText(pdftotextPath, pdfPath) {
  return execFileSync(pdftotextPath, ['-layout', pdfPath, '-'], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 });
}

// Strips Microsoft Learn's print header ("6/29/25, 11:58 AM ... | Microsoft
// Learn") and footer ("https://learn.microsoft.com/... N/M") lines, and the
// standalone publish-date line. Returns the cleaned lines plus the first
// footer URL seen (query string stripped) for sourceUrl.
function cleanPdfText(raw) {
  const lines = raw.split(/\r?\n/);
  const cleaned = [];
  let sourceUrl = null;

  for (const rawLine of lines) {
    // pdftotext -layout inserts a literal form-feed (\f) at every page
    // break, glued onto the start of the next page's first line - every
    // repeated print-header line after the first one on page 1 carried
    // this, silently defeating the anchored header-strip regex below until
    // caught by directly diffing the script's own extraction output.
    const line = rawLine.replace(/^\f/, '');
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}\s+[AP]M/.test(line)) {
      continue; // print header
    }
    if (/^expand table$/i.test(line.trim())) {
      continue; // Microsoft Learn's own collapsible-table UI chrome, not content
    }
    const footerMatch = line.match(/^(https:\/\/learn\.microsoft\.com\/\S+?)(?:\?[^\s]*)?\s+\d+\/\d+\s*$/);
    if (footerMatch) {
      sourceUrl ??= footerMatch[1];
      continue;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(line.trim())) {
      continue; // standalone publish-date line
    }
    cleaned.push(line.replace(/\s+$/, ''));
  }

  return { lines: cleaned, sourceUrl };
}

// Splits cleaned lines into blank-line-delimited blocks, each retaining its
// original (multi-line) text.
function splitIntoBlocks(lines) {
  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length) {
    blocks.push(current);
  }
  return blocks;
}

function looksLikeHeading(block, pageTitle) {
  if (block.length !== 1) {
    return false;
  }
  const text = block[0].trim();
  if (text.length === 0 || text.length > 70) {
    return false;
  }
  if (CODE_LANGUAGE_TAGS.has(text)) {
    return false;
  }
  if (/[.,;:]$/.test(text)) {
    return false;
  }
  if (/^\d+\.\s/.test(text)) {
    return false;
  }
  // The PDF's own in-body title repeat is often prefixed "YARP " even when
  // the canonical title isn't (e.g. "YARP Destination health checks" vs.
  // "Destination health checks") - compare with that prefix stripped from
  // both sides rather than requiring an exact match.
  const normalize = (value) => value.replace(/^YARP\s+/i, '').trim().toLowerCase();
  if (normalize(text) === normalize(pageTitle)) {
    return false;
  }
  if (/^https?:\/\//.test(text)) {
    return false;
  }
  // Real headings are prose, never code fragments: reject anything carrying
  // typical C#/JSON punctuation (a lone "}" closing a JSON block, a
  // property-quote pair, a semicolon-terminated statement) that the
  // isolated-short-line rule alone would otherwise misclassify.
  if (/[{}";=]/.test(text)) {
    return false;
  }
  // A real heading is a short label ("Precedence", "Configuration"), not a
  // full sentence - reject anything with more than ~8 words even if it's
  // under the character-length cap, which otherwise misclassified stray
  // one-line paragraph fragments split apart by the PDF's own line wrapping.
  if (text.split(/\s+/).length > 8) {
    return false;
  }
  // The rules below were added after diffing actual false positives found
  // in the generated output (a code-fragment line surviving every rule
  // above and ending up in a page's TOC) - each one is a confirmed case,
  // not a speculative guess.
  //
  // A call/constructor fragment ("new RouteConfig()") or a wrapped method
  // signature split across two blocks ("...Policy(IFoo" / "foo)") - no real
  // heading in this corpus uses parentheses.
  if (/[()]/.test(text)) {
    return false;
  }
  // A line that's punctuation only (a lone "]" left dangling by a wrapped
  // JSON/C# example) has no letters or digits at all.
  if (!/[a-zA-Z0-9]/.test(text)) {
    return false;
  }
  // Bare code literals and mid-page pagination fragments ("false", "5/8") -
  // not caught by the print-header/footer stripping in cleanPdfText because
  // they don't match that footer's URL-based pattern.
  if (/^(true|false|null)$/i.test(text)) {
    return false;
  }
  if (/^\d+\/\d+$/.test(text)) {
    return false;
  }
  // A qualified identifier ("DestinationHealth.Unhealthy") - dotted with no
  // spaces, which prose headings never are.
  if (/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)+$/.test(text)) {
    return false;
  }
  // Any colon at all marks a key/value example fragment ("HeaderName:
  // value", "Header1: Value1, Value2"), not a heading - a "Note:"/
  // "Important:" callout line never reaches this function in the first
  // place (parseBody checks for that prefix on multi-line blocks before
  // ever calling looksLikeHeading), and a bare "Note"/"Important" label
  // with no colon at all is handled by the exact-match check below.
  if (text.includes(':')) {
    return false;
  }
  if (/^(note|important)$/i.test(text)) {
    return false;
  }
  // A heading is a label, not a sentence fragment left mid-thought by the
  // PDF's own line wrapping ("The default route match precedence order
  // is") - reject anything ending in a common function word no real
  // heading would end on.
  if (/\b(is|the|a|an|of|to|and|or|in|on|for|with)$/i.test(text)) {
    return false;
  }
  return true;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let codeBlockCounter = 0;

function renderCodeBlock(language, codeLines) {
  codeBlockCounter += 1;
  const id = `auto-code-${codeBlockCounter}`;
  const code = codeLines.join('\n').replace(/\n{2,}/g, '\n'); // collapse pdftotext's spurious blank lines inside code
  return (
    `<pre class="code-block"><span class="lang-tag">${escapeHtml(language)}</span>` +
    `<button class="copy-btn" data-copy="${id}" aria-label="Copy code">` +
    `<svg class="copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>` +
    `<svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>` +
    `</button><code id="${id}">${escapeHtml(code)}</code></pre>`
  );
}

function renderCallout(text) {
  return (
    '<div class="callout"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>' +
    `<div><div class="head">Note</div><p>${escapeHtml(text)}</p></div></div>`
  );
}

// Heuristic structural parse: headings (level 2, id via slugify), code
// blocks (started by an isolated language-tag line, ended at the next
// heading/tag/callout/paragraph-looking block), Note:/Important: callouts,
// numbered lists, and everything else as plain paragraphs.
function parseBody(blocks, pageTitle) {
  const headings = [];
  const htmlParts = [];
  let index = 0;

  // A DOM id (and this app's PageToc/scrollspy @for tracking) must be
  // unique per page - looksLikeHeading is a heuristic and can't be made
  // airtight against plain-text-extracted PDFs (confirmed directly: this
  // corpus has pages that legitimately repeat a short subsection heading
  // like "Configuration" twice, once per parallel example), so a repeat
  // slug gets a numeric suffix here rather than trusting the heuristic
  // alone to never collide.
  const idCounts = new Map();
  function uniqueId(base) {
    const seen = (idCounts.get(base) ?? 0) + 1;
    idCounts.set(base, seen);
    return seen === 1 ? base : `${base}-${seen}`;
  }

  while (index < blocks.length) {
    const block = blocks[index];
    const firstLine = block[0].trim();

    if (looksLikeHeading(block, pageTitle)) {
      const id = uniqueId(slugify(firstLine) || `section-${headings.length + 1}`);
      headings.push({ id, text: firstLine, level: 2 });
      htmlParts.push(`<h2 id="${id}">${escapeHtml(firstLine)}</h2>`);
      index += 1;
      continue;
    }

    if (block.length === 1 && CODE_LANGUAGE_TAGS.has(firstLine)) {
      const codeLines = [];
      index += 1;
      while (index < blocks.length) {
        const next = blocks[index];
        const nextFirst = next[0].trim();
        if (looksLikeHeading(next, pageTitle) || (next.length === 1 && CODE_LANGUAGE_TAGS.has(nextFirst))) {
          break;
        }
        codeLines.push(...next, '');
        index += 1;
      }
      while (codeLines.length && codeLines.at(-1) === '') {
        codeLines.pop();
      }
      htmlParts.push(renderCodeBlock(firstLine, codeLines));
      continue;
    }

    const text = block.join(' ').replace(/\s+/g, ' ').trim();
    const normalizedText = text.replace(/^YARP\s+/i, '').trim().toLowerCase();
    if (normalizedText === pageTitle.trim().toLowerCase()) {
      // The PDF's in-body title repeat, too long/word-heavy to have been
      // caught by looksLikeHeading's stricter rules - drop it outright
      // rather than let it become a stray paragraph.
    } else if (/^(Note|Important):?\s/i.test(text)) {
      htmlParts.push(renderCallout(text.replace(/^(Note|Important):?\s*/i, '')));
    } else if (block.every((line) => /^\s*\d+\.\s/.test(line))) {
      const items = block.map((line) => line.replace(/^\s*\d+\.\s*/, ''));
      htmlParts.push(`<ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`);
    } else if (text.length > 0) {
      htmlParts.push(`<p>${escapeHtml(text)}</p>`);
    }
    index += 1;
  }

  return { headings, bodyHtml: htmlParts.join('') };
}

function extractTitleAndLede(lines) {
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);
  const lede = nonEmpty.find((line) => line.length > 60) ?? '';
  return lede;
}

function buildPage(pdftotextPath, item, group, locale) {
  const pdfPath = join(REPO_ROOT, item.pdf);
  if (!existsSync(pdfPath)) {
    throw new Error(`Missing source PDF: ${item.pdf}`);
  }
  const raw = extractPdfText(pdftotextPath, pdfPath);
  const { lines, sourceUrl: extractedSourceUrl } = cleanPdfText(raw);
  const blocks = splitIntoBlocks(lines);
  const { headings, bodyHtml } = parseBody(blocks, item.title);
  const lede = extractTitleAndLede(lines);

  const sourceSlug = SOURCE_URL_SLUG_OVERRIDES[item.slug] ?? item.slug;
  const sourceUrl = extractedSourceUrl?.split('?')[0] ?? `${SOURCE_URL_BASE}${sourceSlug}`;

  return {
    slug: item.slug,
    locale,
    group: group.id,
    kind: item.kind ?? 'doc',
    title: item.title,
    lede: lede || item.title,
    headings,
    bodyHtml,
    sourceUrl,
    lastUpdated: new Date(0).toISOString().slice(0, 10), // stamped precisely below, see NOTE
    translated: locale === DEFAULT_LOCALE,
    prev: null,
    next: null,
  };
}

function computePrevNext(allItems) {
  return allItems.map((item, i) => ({
    ...item,
    prevLink: i > 0 ? { slug: allItems[i - 1].slug, title: allItems[i - 1].title } : null,
    nextLink: i < allItems.length - 1 ? { slug: allItems[i + 1].slug, title: allItems[i + 1].title } : null,
  }));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function main() {
  const pdftotextPath = resolvePdftotext();

  const flatItems = GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id })));
  const orderedForPrevNext = computePrevNext([...flatItems, ...APPENDIX.map((item) => ({ ...item, groupId: 'appendix' }))]);

  // NOTE: lastUpdated is stamped once, at generation time, not derived from
  // the PDFs (they don't carry a reliable per-page date in extracted text).
  const generatedDate = new Date().toISOString().slice(0, 10);

  let generated = 0;
  let skipped = 0;

  for (const orderedItem of orderedForPrevNext) {
    let enPage;

    if (SKIP_SLUGS.has(orderedItem.slug)) {
      // Not regenerated (see SKIP_SLUGS), but still cloned to the other 8
      // locales below like every other page - it was only ever written for
      // en/ in earlier steps, which left it 404ing everywhere else. A
      // "not yet translated" page must still exist with English content;
      // it just isn't this script's job to invent its bodyHtml.
      const enPath = join(OUTPUT_ROOT, 'pages', DEFAULT_LOCALE, `${orderedItem.slug}.json`);
      if (!existsSync(enPath)) {
        throw new Error(`SKIP_SLUGS entry '${orderedItem.slug}' has no existing pages/en/*.json to clone from.`);
      }
      enPage = JSON.parse(readFileSync(enPath, 'utf8'));
      skipped += 1;
    } else {
      const group = GROUPS.find((g) => g.id === orderedItem.groupId) ?? { id: 'appendix' };
      enPage = buildPage(pdftotextPath, orderedItem, group, DEFAULT_LOCALE);
      enPage.lastUpdated = generatedDate;
      enPage.prev = orderedItem.prevLink;
      enPage.next = orderedItem.nextLink;
      writeJson(join(OUTPUT_ROOT, 'pages', DEFAULT_LOCALE, `${orderedItem.slug}.json`), enPage);
      generated += 1;
    }

    for (const locale of LOCALES) {
      if (locale === DEFAULT_LOCALE) {
        continue; // already current (either just written, or untouched for a skipped slug)
      }
      const page = { ...enPage, locale, translated: false };
      writeJson(join(OUTPUT_ROOT, 'pages', locale, `${orderedItem.slug}.json`), page);
    }
  }

  for (const { locale, slug } of MARK_TRANSLATED) {
    const path = join(OUTPUT_ROOT, 'pages', locale, `${slug}.json`);
    if (!existsSync(path)) {
      continue; // slug is in SKIP_SLUGS (hand-authored) - nothing to patch here
    }
    const page = JSON.parse(readFileSync(path, 'utf8'));
    page.translated = true;
    writeJson(path, page);
  }

  // nav/{locale}.json and search-index/{locale}.json: identical (English)
  // content across all 9 locales for now - the nav tree's page titles are
  // content, same as page bodies, and follow the same "ships in English,
  // fills in incrementally" decision. locales.json is untouched (already
  // hand-authored and correct; nothing here needs to regenerate it).
  const navTree = {
    locale: DEFAULT_LOCALE,
    groups: GROUPS.map((group, groupIndex) => ({
      id: group.id,
      label: group.label,
      order: groupIndex + 1,
      items: group.items.map((item, itemIndex) => ({ slug: item.slug, title: item.title, order: itemIndex + 1, kind: 'doc' })),
    })),
    appendix: APPENDIX.map((item, itemIndex) => ({ slug: item.slug, title: item.title, order: itemIndex + 1, kind: 'appendix' })),
  };

  const searchIndex = orderedForPrevNext.map((item) => ({
    slug: item.slug,
    locale: DEFAULT_LOCALE,
    group: item.groupId,
    title: item.title,
    excerpt: item.title,
  }));

  for (const locale of LOCALES) {
    writeJson(join(OUTPUT_ROOT, 'nav', `${locale}.json`), { ...navTree, locale });
    writeJson(join(OUTPUT_ROOT, 'search-index', `${locale}.json`), searchIndex.map((entry) => ({ ...entry, locale })));
  }

  console.log(`Generated ${generated} pages x ${LOCALES.length} locales (skipped ${skipped} hand-authored: ${[...SKIP_SLUGS].join(', ')}).`);
  console.log(`Marked translated:true for ${MARK_TRANSLATED.length} (locale, slug) pairs.`);
}

main();
