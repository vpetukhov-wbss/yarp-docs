import type { LocaleCode, LocaleDescriptor } from './models/locale.model';

// Single source of truth for supported locales - consumed by LanguagePicker,
// the future locale guard, the prerender/content-build tooling, and nowhere
// else. Order matches the approved Phase 1 mockup exactly.
export const SUPPORTED_LOCALES: readonly LocaleDescriptor[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr', isDefault: true },
  { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български', dir: 'ltr' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', dir: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', dir: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português (BR)', dir: 'ltr' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)', nativeLabel: '简体中文', dir: 'ltr' },
];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function isSupportedLocale(value: string): value is LocaleCode {
  return SUPPORTED_LOCALES.some((locale) => locale.code === value);
}
