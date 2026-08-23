import type { Locale } from './i18n/types.ts';
import { intlLocaleTag } from './intlLocale.ts';

function localeTag(locale: Locale): string {
  return locale === 'ar' ? intlLocaleTag('ar') : 'en-GB';
}

export function formatOrderDate(value: string | undefined, locale: Locale): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
