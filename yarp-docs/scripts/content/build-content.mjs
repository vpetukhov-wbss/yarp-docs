#!/usr/bin/env node
// Compiles content/<locale>/<slug>.md into the DocPage/NavTree/
// SearchIndexEntry fixtures under public/assets/mock-api/v1/. Dev-time
// only - see content/README.md for the authoring workflow this feeds.
//
// Resumable by construction: only slugs with an existing
// content/en/<slug>.md get compiled at all, so an in-progress authoring
// pass never leaves the fixture tree in a half-written state for a slug it
// hasn't reached yet. nav/{locale}.json and search-index/{locale}.json only
// regenerate once every one of the 36 English sources exists (a full run,
// not filtered by --slug/--locale) - regenerating them from a partial
// title index would silently drop slugs a previous, separate compiler
// (the one this replaces) already wrote correctly.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ALL_ITEMS, DEFAULT_LOCALE, LOCALES } from './ia.mjs';
import { buildNavTree } from './nav.mjs';
import { buildGroupLabelIndex, buildTitleIndex, contentPath, renderPage } from './render-page.mjs';
import { buildSearchEntries } from './search-index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = join(__dirname, '..', '..', 'content');
const I18N_ROOT = join(__dirname, '..', '..', 'public', 'assets', 'i18n');
const OUTPUT_ROOT = join(__dirname, '..', '..', 'public', 'assets', 'mock-api', 'v1');

function parseArgs(argv) {
  const args = { locale: null, slug: null };
  for (const arg of argv) {
    if (arg.startsWith('--locale=')) {
      args.locale = arg.slice('--locale='.length);
    } else if (arg.startsWith('--slug=')) {
      args.slug = arg.slice('--slug='.length);
    }
  }
  return args;
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function buildContent({ locale: localeFilter = null, slug: slugFilter = null, log = console.log } = {}) {
  const allSlugs = ALL_ITEMS.map((item) => item.slug);
  const availableSlugs = allSlugs.filter((slug) => existsSync(contentPath(CONTENT_ROOT, DEFAULT_LOCALE, slug)));
  const slugsToBuild = slugFilter ? availableSlugs.filter((slug) => slug === slugFilter) : availableSlugs;
  const locales = localeFilter ? [localeFilter] : LOCALES;

  if (slugFilter && !availableSlugs.includes(slugFilter)) {
    throw new Error(`No content/${DEFAULT_LOCALE}/${slugFilter}.md exists - nothing to build for slug "${slugFilter}"`);
  }

  const titleIndex = buildTitleIndex(CONTENT_ROOT, LOCALES, availableSlugs);
  const groupLabelIndex = buildGroupLabelIndex(CONTENT_ROOT, LOCALES);

  const pagesBySlugLocale = new Map(); // slug -> locale -> { page, keywords }
  let pagesWritten = 0;

  for (const slug of slugsToBuild) {
    const item = ALL_ITEMS.find((i) => i.slug === slug);
    const byLocale = new Map();
    pagesBySlugLocale.set(slug, byLocale);

    // English first, always - every other locale's untranslated fallback
    // and translated id-transplant both depend on it.
    const enResult = renderPage({
      locale: DEFAULT_LOCALE,
      slug,
      group: item.groupId,
      kind: item.kind,
      contentRoot: CONTENT_ROOT,
      i18nRoot: I18N_ROOT,
      titleIndex,
    });
    byLocale.set(DEFAULT_LOCALE, enResult);

    for (const locale of locales) {
      if (locale === DEFAULT_LOCALE) {
        continue;
      }
      const result = renderPage({
        locale,
        slug,
        group: item.groupId,
        kind: item.kind,
        contentRoot: CONTENT_ROOT,
        i18nRoot: I18N_ROOT,
        titleIndex,
        englishHeadings: enResult.page.headings,
      });
      byLocale.set(locale, result);
    }

    for (const [locale, { page }] of byLocale) {
      if (localeFilter && locale !== localeFilter) {
        continue;
      }
      writeJson(join(OUTPUT_ROOT, 'pages', locale, `${slug}.json`), page);
      pagesWritten += 1;
    }
  }

  log(`Compiled ${pagesWritten} page file(s) across ${slugsToBuild.length} slug(s) x ${locales.length} locale(s).`);

  const isFullRun = !localeFilter && !slugFilter && availableSlugs.length === allSlugs.length;
  if (!isFullRun) {
    const missing = allSlugs.filter((slug) => !availableSlugs.includes(slug));
    if (missing.length) {
      log(`Skipped nav/search-index regeneration - ${missing.length} slug(s) have no English source yet: ${missing.join(', ')}`);
    } else {
      log('Skipped nav/search-index regeneration - run without --locale/--slug for a full pass.');
    }
    return { pagesWritten, navWritten: 0, searchEntriesWritten: 0 };
  }

  let navWritten = 0;
  let searchEntriesWritten = 0;
  for (const locale of LOCALES) {
    writeJson(join(OUTPUT_ROOT, 'nav', `${locale}.json`), buildNavTree(locale, titleIndex, groupLabelIndex));
    navWritten += 1;

    const entries = allSlugs.flatMap((slug) => {
      const { page, keywords } = pagesBySlugLocale.get(slug).get(locale);
      return buildSearchEntries(page, keywords);
    });
    writeJson(join(OUTPUT_ROOT, 'search-index', `${locale}.json`), entries);
    searchEntriesWritten += entries.length;
  }
  log(`Compiled nav + search-index for ${navWritten} locale(s), ${searchEntriesWritten} search entries total.`);

  return { pagesWritten, navWritten, searchEntriesWritten };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  buildContent(args);
}

// pathToFileURL handles Windows drive-letter casing, backslashes, and
// spaces correctly, unlike a hand-rolled string comparison - that fragile
// version silently never matched on Windows (main() never ran, exit code
// still 0), caught only by testing this file directly, not by inspection.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
