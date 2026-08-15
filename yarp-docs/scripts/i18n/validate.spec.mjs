import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { extractPlaceholders, validateI18nParity } from './validate.mjs';

describe('extractPlaceholders', () => {
  it('returns an empty set for a string with no placeholders', () => {
    expect(extractPlaceholders('Search documentation')).toEqual(new Set());
  });

  it('extracts every {{name}} token, ignoring surrounding whitespace inside the braces', () => {
    expect(extractPlaceholders('No results for "{{ query }}".')).toEqual(new Set(['query']));
    expect(extractPlaceholders('{{a}} and {{b}}')).toEqual(new Set(['a', 'b']));
  });

  it('is not fooled by single-brace text', () => {
    expect(extractPlaceholders('{learnLink} is not a placeholder')).toEqual(new Set());
  });
});

describe('validateI18nParity', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'i18n-parity-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function write(locale, catalog) {
    writeFileSync(join(dir, `${locale}.json`), JSON.stringify(catalog), 'utf8');
  }

  it('reports nothing when every locale matches the base locale key-for-key', () => {
    write('en', { a: { b: 'Hello {{name}}' } });
    write('fr', { a: { b: 'Bonjour {{name}}' } });
    expect(validateI18nParity(dir, ['en', 'fr'])).toEqual([]);
  });

  it('flags a key present in the base locale but missing from another', () => {
    write('en', { a: 'x', b: 'y' });
    write('fr', { a: 'x' });
    expect(validateI18nParity(dir, ['en', 'fr'])).toEqual([{ kind: 'missing-key', locale: 'fr', key: 'b' }]);
  });

  it('flags a key present in a locale but absent from the base locale', () => {
    write('en', { a: 'x' });
    write('fr', { a: 'x', b: 'y' });
    expect(validateI18nParity(dir, ['en', 'fr'])).toEqual([{ kind: 'extra-key', locale: 'fr', key: 'b' }]);
  });

  it('flags a placeholder dropped in translation', () => {
    write('en', { a: 'Hello {{name}}' });
    write('fr', { a: 'Bonjour' });
    expect(validateI18nParity(dir, ['en', 'fr'])).toEqual([
      { kind: 'placeholder-mismatch', locale: 'fr', key: 'a', expected: ['name'], actual: [] },
    ]);
  });

  it('flags a placeholder renamed in translation', () => {
    write('en', { a: 'Hello {{name}}' });
    write('fr', { a: 'Bonjour {{nom}}' });
    expect(validateI18nParity(dir, ['en', 'fr'])).toEqual([
      { kind: 'placeholder-mismatch', locale: 'fr', key: 'a', expected: ['name'], actual: ['nom'] },
    ]);
  });

  it('does not require identical prose, only identical keys and placeholders', () => {
    write('en', { a: 'Adapted from {{learnLink}}, licensed under {{ccByLink}}.' });
    write('zh-Hans', { a: '改编自 {{learnLink}}，遵循 {{ccByLink}} 许可协议。' });
    expect(validateI18nParity(dir, ['en', 'zh-Hans'])).toEqual([]);
  });
});

describe('the real public/assets/i18n catalogs', () => {
  const I18N_ROOT = join(import.meta.dirname, '..', '..', 'public', 'assets', 'i18n');
  const LOCALES = ['en', 'bg', 'ru', 'fr', 'el', 'es', 'de', 'pt-BR', 'zh-Hans'];

  it('are in full key and placeholder parity with en.json', () => {
    expect(validateI18nParity(I18N_ROOT, LOCALES)).toEqual([]);
  });
});
