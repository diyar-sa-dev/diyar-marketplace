import type { Locale } from './i18n/types.ts';

/** BCP-47 tag with Western (Latin) digits for Arabic UI. */
export function intlLocaleTag(locale: string | Locale): string {
  if (locale === 'ar') {
    return 'ar-SA-u-nu-latn';
  }

  return 'en-US';
}

export function formatLocaleNumber(
  value: number,
  locale: string | Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(intlLocaleTag(locale), options).format(value);
}

export function formatLocaleDate(
  value: Date | string | number,
  locale: string | Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(intlLocaleTag(locale), options).format(date);
}

export function formatLocaleDateTime(
  value: Date | string | number,
  locale: string | Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatLocaleDate(value, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}
