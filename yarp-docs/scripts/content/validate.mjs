#!/usr/bin/env node
// Validates the compiled fixture tree under public/assets/mock-api/v1/ -
// not the compiler's own logic (that's markdown.spec.mjs/render-page.spec.mjs/
// search-index.spec.mjs), but the OUTPUT, so it also catches a hand-edited
// JSON file that violates an invariant the compiler itself would never
// produce. Exposed as `npm run content:check` and as a plain function
// (validateFixtures) so a Vitest spec can call it too.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ALL_ITEMS, DEFAULT_LOCALE, LOCALES } from './ia.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = join(__dirname, '..', '..', 'public', 'assets', 'mock-api', 'v1');
const I18N_ROOT = join(__dirname, '..', '..', 'public', 'assets', 'i18n');

const DOC_PAGE_KEYS = new Set([
  'slug',
  'locale',
  'group',
  'kind',
  'title',
  'lede',
  'headings',
  'bodyHtml',
  'sourceUrl',
  'lastUpdated',
  'translated',
  'prev',
  'next',
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, '');
}

// Prose only - two categories of bodyHtml text must NOT count toward "is
// this page's text actually different from English": code-block content
// (identical to English by construction regardless of translation - see
// markdown.mjs), and localized-chrome text that isn't page content at all
// (a callout's "Note"/"Important"/"Tip" label, rendered from the target
// locale's docBody strings even on an untranslated page - see
// render-page.mjs). Without stripping the latter, an untranslated page
// legitimately showing a translated callout label reads as "prose differs
// from English" even though not one sentence of actual content changed -
// caught directly by running this against this pass's own freshly compiled
// output, not a hypothetical.
function proseOnly(bodyHtml) {
  const withoutCode = bodyHtml.replace(/<pre[^>]*>[\s\S]*?<\/pre>/g, '');
  const withoutCalloutLabel = withoutCode.replace(/<div class="head">[\s\S]*?<\/div>/g, '');
  return stripTags(withoutCalloutLabel).replace(/\s+/g, ' ').trim();
}

function extractCodeBlocks(bodyHtml) {
  return [...bodyHtml.matchAll(/<code id="[^"]*">([\s\S]*?)<\/code>/g)].map((m) => stripTags(m[1]));
}

function pushIssue(issues, message) {
  issues.push(message);
}

export function validateFixtures({ locales = LOCALES, slugs = ALL_ITEMS.map((i) => i.slug) } = {}) {
  const issues = [];
  const pagesByLocale = new Map();

  for (const locale of locales) {
    const bySlug = new Map();
    for (const slug of slugs) {
      const path = join(OUTPUT_ROOT, 'pages', locale, `${slug}.json`);
      if (!existsSync(path)) {
        pushIssue(issues, `Missing pages/${locale}/${slug}.json`);
        continue;
      }
      let page;
      try {
        page = readJson(path);
      } catch (error) {
        pushIssue(issues, `pages/${locale}/${slug}.json is not valid JSON: ${error.message}`);
        continue;
      }
      bySlug.set(slug, page);

      const keys = Object.keys(page);
      const missing = [...DOC_PAGE_KEYS].filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !DOC_PAGE_KEYS.has(k));
      if (missing.length) pushIssue(issues, `pages/${locale}/${slug}.json missing key(s): ${missing.join(', ')}`);
      if (extra.length) pushIssue(issues, `pages/${locale}/${slug}.json has unexpected key(s): ${extra.join(', ')}`);

      if (page.locale !== locale) pushIssue(issues, `pages/${locale}/${slug}.json has locale "${page.locale}", expected "${locale}"`);
      if (page.slug !== slug) pushIssue(issues, `pages/${locale}/${slug}.json has slug "${page.slug}", expected "${slug}"`);

      // Heading ids unique per page, and bidirectional agreement between
      // headings[] and the actual id="..." anchors rendered into bodyHtml -
      // catches both a broken TOC (an id in headings[] that isn't really in
      // the page) and an orphan anchor (one in bodyHtml that headings[]
      // doesn't know about, so PageToc/search can never point to it).
      const headingIds = page.headings?.map((h) => h.id) ?? [];
      const dupes = headingIds.filter((id, i) => headingIds.indexOf(id) !== i);
      if (dupes.length) pushIssue(issues, `pages/${locale}/${slug}.json has duplicate heading ids: ${[...new Set(dupes)].join(', ')}`);
      const bodyHeadingIds = [...(page.bodyHtml?.matchAll(/<h[23] id="([^"]+)"/g) ?? [])].map((m) => m[1]);
      for (const id of headingIds) {
        if (!bodyHeadingIds.includes(id)) pushIssue(issues, `pages/${locale}/${slug}.json: heading id "${id}" not found as an anchor in bodyHtml`);
      }
      for (const id of bodyHeadingIds) {
        if (!headingIds.includes(id)) pushIssue(issues, `pages/${locale}/${slug}.json: bodyHtml anchor "${id}" is missing from headings[]`);
      }

      // The "es false-flag" bug class (translated:true must mean the prose
      // actually differs from English, and vice versa) is checked further
      // below, once every locale's pages are loaded and English is
      // available as the reference to compare against.

      if (locale !== DEFAULT_LOCALE) {
        const copyCodeEnglish = page.bodyHtml?.includes('aria-label="Copy code"');
        if (copyCodeEnglish) {
          const localeI18nPath = join(I18N_ROOT, `${locale}.json`);
          const localeCopyLabel = existsSync(localeI18nPath) ? readJson(localeI18nPath).docBody?.copyCode : undefined;
          if (localeCopyLabel && localeCopyLabel !== 'Copy code') {
            pushIssue(issues, `pages/${locale}/${slug}.json still has the English "Copy code" aria-label instead of "${localeCopyLabel}"`);
          }
        }
      }
    }
    pagesByLocale.set(locale, bySlug);
  }

  // Cross-locale checks that need the English page as a reference.
  const enPages = pagesByLocale.get(DEFAULT_LOCALE);
  if (enPages) {
    for (const locale of locales) {
      if (locale === DEFAULT_LOCALE) continue;
      const localePages = pagesByLocale.get(locale);
      for (const slug of slugs) {
        const enPage = enPages.get(slug);
        const page = localePages?.get(slug);
        if (!enPage || !page) continue;

        const enProse = proseOnly(enPage.bodyHtml);
        const prose = proseOnly(page.bodyHtml);
        if (page.translated && prose === enProse) {
          pushIssue(issues, `pages/${locale}/${slug}.json is translated:true but its prose is byte-identical to English`);
        }
        if (!page.translated && prose !== enProse) {
          pushIssue(issues, `pages/${locale}/${slug}.json is translated:false but its prose differs from English (partial translation with a stale flag?)`);
        }

        // Code is taken from English by construction (see markdown.mjs's
        // container/code renderers), so it must be byte-identical in every
        // locale regardless of translation status - any difference means
        // someone translated code, which is exactly what this design exists
        // to prevent.
        const enCode = extractCodeBlocks(enPage.bodyHtml);
        const code = extractCodeBlocks(page.bodyHtml);
        if (JSON.stringify(enCode) !== JSON.stringify(code)) {
          pushIssue(issues, `pages/${locale}/${slug}.json has code content that differs from English (code must never be translated)`);
        }

        // prev/next titles must match the target's own title in this
        // locale (or English, if the target isn't translated) - never a
        // stale or mismatched title independently drifted from the page
        // itself.
        for (const key of ['prev', 'next']) {
          const link = page[key];
          if (!link) continue;
          const targetPage = localePages?.get(link.slug) ?? enPages.get(link.slug);
          if (targetPage && link.title !== targetPage.title) {
            pushIssue(
              issues,
              `pages/${locale}/${slug}.json's ${key}.title ("${link.title}") does not match ${link.slug}'s actual title ("${targetPage.title}") in this locale`,
            );
          }
        }
      }
    }
  }

  // nav/{locale}.json: item titles must match the corresponding page's own
  // title, and the slug set must match exactly - the "es mismatches its own
  // nav 31/36" class of bug.
  for (const locale of locales) {
    const navPath = join(OUTPUT_ROOT, 'nav', `${locale}.json`);
    if (!existsSync(navPath)) continue;
    const nav = readJson(navPath);
    const localePages = pagesByLocale.get(locale);
    const navItems = [...nav.groups.flatMap((g) => g.items), ...nav.appendix];
    for (const item of navItems) {
      const page = localePages?.get(item.slug);
      if (page && item.title !== page.title) {
        pushIssue(issues, `nav/${locale}.json's title for "${item.slug}" ("${item.title}") does not match the page's own title ("${page.title}")`);
      }
    }
  }

  return issues;
}

function main() {
  const issues = validateFixtures();
  if (issues.length === 0) {
    console.log('content:check - all fixtures pass validation.');
    return;
  }
  console.error(`content:check - ${issues.length} issue(s) found:\n`);
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
