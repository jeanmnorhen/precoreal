
export const i18n = {
  defaultLocale: 'pt',
  locales: ['en', 'pt', 'es', 'ru', 'zh-CN', 'es-CL', 'es-MX'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
