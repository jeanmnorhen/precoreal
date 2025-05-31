
export const i18n = {
  defaultLocale: 'pt',
  locales: ['en', 'pt', 'es'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
