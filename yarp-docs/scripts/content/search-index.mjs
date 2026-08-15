import { stripTags } from './highlight.mjs';

const MAX_EXCERPT_LENGTH = 160;
const MAX_KEYWORDS = 12;
const INLINE_CODE_RE = /<code(?:\s+id="[^"]*")?>([^<]*)<\/code>/g;
const NEXT_HEADING_RE = /<h[23] id="/;

function truncateAtWordBoundary(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function sectionHtmlFor(bodyHtml, heading) {
  const openTag = `id="${heading.id}"`;
  const openIdx = bodyHtml.indexOf(openTag);
  if (openIdx === -1) {
    return '';
  }
  const tagCloseIdx = bodyHtml.indexOf('>', openIdx) + 1;
  const headingCloseTag = `</h${heading.level}>`;
  const contentStart = bodyHtml.indexOf(headingCloseTag, tagCloseIdx) + headingCloseTag.length;
  const rest = bodyHtml.slice(contentStart);
  const nextHeadingMatch = NEXT_HEADING_RE.exec(rest);
  return nextHeadingMatch ? rest.slice(0, nextHeadingMatch.index) : rest;
}

function excerptFor(sectionHtml) {
  const plainText = stripTags(sectionHtml).replace(/\s+/g, ' ').trim();
  return truncateAtWordBoundary(plainText, MAX_EXCERPT_LENGTH);
}

function sectionKeywords(sectionHtml) {
  const found = [];
  for (const match of sectionHtml.matchAll(INLINE_CODE_RE)) {
    const text = stripTags(match[1]).trim();
    // A short identifier, not a multi-line code listing that happens to
    // also use a <code> tag (a code-block's <code id="..."> can match the
    // same pattern) - length and no-newline both have to hold.
    if (text && text.length <= 40 && !text.includes('\n') && !found.includes(text)) {
      found.push(text);
    }
  }
  return found;
}

function dedupeCapped(values, cap) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
      if (out.length >= cap) {
        break;
      }
    }
  }
  return out;
}

// One page-level entry (excerpt = the authored lede, guaranteed distinct
// from the title by the lede validator) plus one entry per h2/h3, each with
// a `Page › Section › Subsection`-style headingPath (matching the format
// SearchIndexEntry's own doc comment describes) and a locale-invariant
// anchor - translated pages get English's transplanted ids (render-page.mjs),
// so a result deep-links correctly regardless of locale.
export function buildSearchEntries(page, frontmatterKeywords = []) {
  const pageKeywords = dedupeCapped(frontmatterKeywords, MAX_KEYWORDS);
  const entries = [
    {
      slug: page.slug,
      locale: page.locale,
      group: page.group,
      title: page.title,
      excerpt: page.lede,
      ...(pageKeywords.length ? { keywords: pageKeywords } : {}),
    },
  ];

  const pathStack = [page.title];
  let lastLevel = 1;
  for (const heading of page.headings) {
    // Keep the path stack one entry per level: pop back to this heading's
    // level, then push it - "Page › H2 › H3" for an h3, "Page › H2" for an
    // h2 that follows it.
    while (pathStack.length > 1 && lastLevel >= heading.level) {
      pathStack.pop();
      lastLevel -= 1;
    }
    pathStack.push(heading.text);
    lastLevel = heading.level;

    const sectionHtml = sectionHtmlFor(page.bodyHtml, heading);
    const excerpt = excerptFor(sectionHtml) || page.lede;
    const keywords = dedupeCapped([...frontmatterKeywords, ...sectionKeywords(sectionHtml)], MAX_KEYWORDS);

    entries.push({
      slug: page.slug,
      locale: page.locale,
      group: page.group,
      title: page.title,
      headingPath: pathStack.join(' › '),
      anchor: heading.id,
      excerpt,
      ...(keywords.length ? { keywords } : {}),
    });
  }

  return entries;
}
