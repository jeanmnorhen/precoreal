
import type { Locale } from '@/i18n-config';

// We enumerate all dictionaries here for better linting and typescript support
// We do not support dynamically importing json files as this will cause issues with webpack
const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  pt: () => import('@/dictionaries/pt.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
  ru: () => import('@/dictionaries/ru.json').then((module) => module.default),
  'zh-CN': () => import('@/dictionaries/zh-CN.json').then((module) => module.default),
  'es-CL': () => import('@/dictionaries/es-CL.json').then((module) => module.default),
  'es-MX': () => import('@/dictionaries/es-MX.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  const loadFunction = dictionaries[locale] ?? dictionaries.pt; // Fallback to 'pt'
  return loadFunction();
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
