#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ALL_ITEMS, DEFAULT_LOCALE, LOCALES } from '../content/ia.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://yarp.dev';

const PROJECT_SLUGS = ['dudewash', 'foodreg', 'rasm', 'qwen-hosting'];
const STATIC_PATHS = ['', 'projects', 'engineering', 'about', 'docs'];
const PROJECT_PATHS = PROJECT_SLUGS.map((slug) => `projects/${slug}`);
const DOC_PATHS = ALL_ITEMS.map((item) => item.slug);
const ALL_PATHS = [...STATIC_PATHS, ...PROJECT_PATHS, ...DOC_PATHS];

function urlFor(locale, path) {
  return path ? `${SITE_URL}/${locale}/${path}` : `${SITE_URL}/${locale}`;
}

function entryFor(path) {
  const alternates = LOCALES.map(
    (locale) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${urlFor(locale, path)}" />`,
  ).join('\n');
  const defaultAlternate = `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(DEFAULT_LOCALE, path)}" />`;

  return LOCALES.map(
    (locale) =>
      `  <url>\n    <loc>${urlFor(locale, path)}</loc>\n${alternates}\n${defaultAlternate}\n  </url>`,
  ).join('\n');
}

export function buildSitemap() {
  const body = ALL_PATHS.map(entryFor).join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    `${body}\n` +
    '</urlset>\n'
  );
}

function main() {
  const xml = buildSitemap();
  writeFileSync(OUTPUT_PATH, xml, 'utf8');
  const urlCount = ALL_PATHS.length * LOCALES.length;
  console.log(`Wrote ${OUTPUT_PATH} (${urlCount} URLs across ${LOCALES.length} locales).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
