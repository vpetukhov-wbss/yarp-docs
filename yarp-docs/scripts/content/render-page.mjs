import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { load as loadYaml } from 'js-yaml';

import { ALL_ITEMS, DEFAULT_LOCALE, prevNextFor, sourceUrlFor } from './ia.mjs';
import { createPageRenderer, UnknownDocLinkError } from './markdown.mjs';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function contentPath(contentRoot, locale, slug) {
  return join(contentRoot, locale, `${slug}.md`);
}

export function splitFrontmatter(raw, filePath) {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) {
    throw new Error(`${filePath}: missing YAML frontmatter (expected a leading "---" block)`);
  }
  const [, yamlText, body] = match;
  const frontmatter = loadYaml(yamlText) ?? {};
  return { frontmatter, body };
}

export function readDocBodyStrings(i18nRoot, locale) {
  const raw = readFileSync(join(i18nRoot, `${locale}.json`), 'utf8');
  const parsed = JSON.parse(raw);
  const docBody = parsed.docBody;
  if (!docBody) {
    throw new Error(`${locale}.json is missing the "docBody" namespace the content compiler reads from`);
  }
  return docBody;
}

const KNOWN_SLUGS = new Set(ALL_ITEMS.map((item) => item.slug));

// titleIndex: Map<locale, Map<slug, title>>. Deliberately "best available
// title regardless of the current page's own translation state" - a cross-
// link or prev/next reference always shows the target's real title if that
// target happens to be translated in this locale, falling back to English
// only when it isn't. This is the same rule nav/{locale}.json already
// follows (translated independently of page-body translation status), so a
// link's title and the sidebar's title for the same page never disagree.
//
// Returns null ONLY when targetSlug isn't a real slug at all (not in
// ia.mjs's ALL_ITEMS) - that's what makes a `doc:` link to it a hard build
// error (UnknownDocLinkError, see markdown.mjs). A slug that IS real but
// doesn't have a content/<locale>/<slug>.md yet (normal mid-authoring, e.g.
// while only a few of the 36 pages exist) falls back to the bare slug as a
// placeholder instead of failing the whole build - once every slug has a
// source file, which a full run requires anyway, this fallback can't fire.
export function makeTitleResolver(titleIndex, locale) {
  return (targetSlug) => {
    const title = titleIndex.get(locale)?.get(targetSlug) ?? titleIndex.get(DEFAULT_LOCALE)?.get(targetSlug);
    if (title) {
      return title;
    }
    return KNOWN_SLUGS.has(targetSlug) ? targetSlug : null;
  };
}

export function buildTitleIndex(contentRoot, locales, slugs) {
  const index = new Map();
  for (const locale of locales) {
    const bySlug = new Map();
    for (const slug of slugs) {
      const path = contentPath(contentRoot, locale, slug);
      if (!existsSync(path)) {
        continue;
      }
      const { frontmatter } = splitFrontmatter(readFileSync(path, 'utf8'), path);
      bySlug.set(slug, frontmatter.title);
    }
    index.set(locale, bySlug);
  }
  return index;
}

// content/<locale>/_groups.json: a flat { [groupId]: label } map (plus an
// "appendix" key for the appendix section's own label, if the locale wants
// one distinct from English). Locales that don't have this file yet (or are
// missing a specific key) fall back to English inside buildNavTree, same
// fallback shape as buildTitleIndex.
export function buildGroupLabelIndex(contentRoot, locales) {
  const index = new Map();
  for (const locale of locales) {
    const path = join(contentRoot, locale, '_groups.json');
    const byId = new Map();
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      for (const [id, label] of Object.entries(parsed)) {
        byId.set(id, label);
      }
    }
    index.set(locale, byId);
  }
  return index;
}

function appendSeeAlso(bodyHtml, headings, seeAlsoSlugs, resolveDocTitle, locale, docBodyStrings, currentSlug) {
  const items = seeAlsoSlugs.map((targetSlug) => {
    const title = resolveDocTitle(targetSlug);
    if (title === null) {
      throw new UnknownDocLinkError(targetSlug, currentSlug);
    }
    return `<li><a href="/${locale}/${targetSlug}">${escapeHtmlLocal(title)}</a></li>`;
  });
  const id = 'see-also';
  const heading = { id, text: docBodyStrings.seeAlso, level: 2 };
  const html = `${bodyHtml}<h2 id="${id}">${escapeHtmlLocal(docBodyStrings.seeAlso)}</h2><ul>${items.join('')}</ul>`;
  return { bodyHtml: html, headings: [...headings, heading] };
}

// Local, tiny escaper - not imported from highlight.mjs to keep this
// module's dependency on that one purely about code highlighting, not text
// escaping in general. Identical implementation.
function escapeHtmlLocal(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Rewrites a translated page's fallback-slugified heading ids to English's
// authored ones, in both headings[] and the inline `<h2/h3 id="...">` tags
// in bodyHtml - see markdown.mjs's HEADING_ID_RE comment for why. Every id
// this function replaces is unique within its own page (translated files'
// ids come from slugifyFallback, which dedupes against everything rendered
// so far on that page), so a plain single-occurrence string replace is
// exact - no regex escaping, no risk of touching an unrelated `id="..."`
// elsewhere in the page (code-block ids use a disjoint `{slug}-code-{n}`
// scheme and are never touched here).
export function transplantHeadingIds(bodyHtml, headings, englishHeadings, slug) {
  if (headings.length !== englishHeadings.length) {
    throw new Error(
      `${slug}: heading count mismatch - translated file has ${headings.length}, English has ${englishHeadings.length}. ` +
        'A translated page must have exactly the same headings, in the same order, as its English source.',
    );
  }
  let html = bodyHtml;
  const transplanted = headings.map((heading, index) => {
    const enHeading = englishHeadings[index];
    if (heading.level !== enHeading.level) {
      throw new Error(
        `${slug}: heading level mismatch at position ${index} - translated has h${heading.level} ("${heading.text}"), ` +
          `English has h${enHeading.level} ("${enHeading.text}").`,
      );
    }
    html = html.replace(`id="${heading.id}"`, `id="${enHeading.id}"`);
    return { id: enHeading.id, text: heading.text, level: heading.level };
  });
  return { bodyHtml: html, headings: transplanted };
}

// Renders one (locale, slug) DocPage. `englishHeadings` is required for
// every non-English, non-appendix... actually: required whenever
// locale !== DEFAULT_LOCALE AND the locale has its own translated file
// (translated === true) - that's exactly the case that needs id transplant.
// Pass null when rendering the English page itself (nothing to transplant
// from) or an untranslated page (its body IS the English source, so its
// ids already match without help).
// group/kind come from the caller (which reads them off ia.mjs's ALL_ITEMS,
// the same way prevSlug/nextSlug do below) rather than frontmatter or a
// re-derivation in here - group membership is a navigational decision, not
// something a single page's own file should be able to drift from.
export function renderPage({ locale, slug, group, kind, contentRoot, i18nRoot, titleIndex, englishHeadings }) {
  const localePath = contentPath(contentRoot, locale, slug);
  const translated = locale === DEFAULT_LOCALE || existsSync(localePath);
  const sourcePath = translated ? localePath : contentPath(contentRoot, DEFAULT_LOCALE, slug);

  const raw = readFileSync(sourcePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw, sourcePath);
  if (frontmatter.slug !== slug) {
    throw new Error(`${sourcePath}: frontmatter slug "${frontmatter.slug}" does not match filename slug "${slug}"`);
  }

  const docBodyStrings = readDocBodyStrings(i18nRoot, locale);
  const resolveDocTitle = makeTitleResolver(titleIndex, locale);
  const renderer = createPageRenderer({ locale, slug, docBodyStrings, resolveDocTitle });

  let { bodyHtml, headings } = renderer.render(body);

  if (frontmatter.seeAlso?.length) {
    ({ bodyHtml, headings } = appendSeeAlso(bodyHtml, headings, frontmatter.seeAlso, resolveDocTitle, locale, docBodyStrings, slug));
  }

  if (translated && locale !== DEFAULT_LOCALE) {
    if (!englishHeadings) {
      throw new Error(`${slug}: rendering a translated ${locale} page requires englishHeadings to be passed in`);
    }
    ({ bodyHtml, headings } = transplantHeadingIds(bodyHtml, headings, englishHeadings, slug));
  }

  const { prevSlug, nextSlug } = prevNextFor(slug);
  // For an untranslated page, `frontmatter` above is already the English
  // file's frontmatter (sourcePath fell back to it), so title/lede/keywords
  // are already correct without a second read.
  const title = frontmatter.title;

  const page = {
    slug,
    locale,
    group,
    kind,
    title,
    lede: frontmatter.lede,
    headings,
    bodyHtml,
    sourceUrl: frontmatter.sourceUrl ?? sourceUrlFor(slug),
    lastUpdated: frontmatter.lastUpdated,
    translated,
    // Falls back to the bare slug, not null, when the neighbor hasn't been
    // authored yet - keeps output type-valid (DocPageLink.title is a
    // string, never null) during an incremental authoring pass; once every
    // slug has a source file (the state a full run requires anyway), every
    // neighbor resolves for real and this fallback never fires.
    prev: prevSlug ? { slug: prevSlug, title: resolveDocTitle(prevSlug) ?? prevSlug } : null,
    next: nextSlug ? { slug: nextSlug, title: resolveDocTitle(nextSlug) ?? nextSlug } : null,
  };

  // keywords isn't part of the DocPage DTO (search-index.mjs is the only
  // consumer) - returned alongside rather than folded in, so renderPage's
  // return value doesn't silently grow the app-facing page shape.
  return { page, keywords: frontmatter.keywords ?? [] };
}
