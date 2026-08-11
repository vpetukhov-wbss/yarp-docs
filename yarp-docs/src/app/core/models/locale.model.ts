export type LocaleCode = 'bg' | 'en' | 'ru' | 'fr' | 'el' | 'es' | 'de' | 'pt-BR' | 'zh-Hans';

export interface LocaleDescriptor {
  readonly code: LocaleCode;
  readonly label: string;
  readonly nativeLabel: string;
  readonly dir: 'ltr';
  readonly isDefault?: boolean;
}
