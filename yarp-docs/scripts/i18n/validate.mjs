// Cross-locale checks for public/assets/i18n/*.json: every locale must
// define exactly the same set of translation keys as the base locale, and
// every ngx-translate {{placeholder}} in a base-locale string must appear
// (spelled identically) in that same key's translation - a translator
// renaming or dropping a param breaks interpolation silently at runtime
// otherwise, since ngx-translate just leaves an unmatched {{token}} in the
// rendered string instead of erroring.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PLACEHOLDER_RE = /\{\{\s*(\w+)\s*\}\}/g;

function flatten(catalog, prefix = '') {
  const keys = new Map();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedPath, nestedValue] of flatten(value, path)) {
        keys.set(nestedPath, nestedValue);
      }
    } else {
      keys.set(path, value);
    }
  }
  return keys;
}

export function extractPlaceholders(value) {
  if (typeof value !== 'string') {
    return new Set();
  }
  return new Set(Array.from(value.matchAll(PLACEHOLDER_RE), (match) => match[1]));
}

export function loadLocaleCatalog(i18nRoot, locale) {
  return JSON.parse(readFileSync(join(i18nRoot, `${locale}.json`), 'utf8'));
}

// Returns an issues array (empty means every locale is in parity with
// baseLocale). Each issue is one of:
//   { kind: 'missing-key' | 'extra-key', locale, key }
//   { kind: 'placeholder-mismatch', locale, key, expected: string[], actual: string[] }
export function validateI18nParity(i18nRoot, locales, baseLocale = 'en') {
  if (!locales.includes(baseLocale)) {
    throw new Error(`baseLocale "${baseLocale}" must be included in locales`);
  }
  const issues = [];
  const catalogs = new Map(locales.map((locale) => [locale, flatten(loadLocaleCatalog(i18nRoot, locale))]));
  const base = catalogs.get(baseLocale);

  for (const locale of locales) {
    if (locale === baseLocale) {
      continue;
    }
    const catalog = catalogs.get(locale);

    for (const key of base.keys()) {
      if (!catalog.has(key)) {
        issues.push({ kind: 'missing-key', locale, key });
      }
    }
    for (const key of catalog.keys()) {
      if (!base.has(key)) {
        issues.push({ kind: 'extra-key', locale, key });
      }
    }
    for (const [key, baseValue] of base) {
      if (!catalog.has(key)) {
        continue; // already reported as missing-key above
      }
      const expected = extractPlaceholders(baseValue);
      const actual = extractPlaceholders(catalog.get(key));
      const matches = expected.size === actual.size && [...expected].every((name) => actual.has(name));
      if (!matches) {
        issues.push({
          kind: 'placeholder-mismatch',
          locale,
          key,
          expected: [...expected].sort(),
          actual: [...actual].sort(),
        });
      }
    }
  }
  return issues;
}
