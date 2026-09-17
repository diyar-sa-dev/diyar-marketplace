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

/** DD/MM/YYYY + Western digits — identical in AR and EN UI (enterprise timestamps). */
export function formatWesternDateTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${pick('day')}/${pick('month')}/${pick('year')}, ${pick('hour')}:${pick('minute')} ${pick('dayPeriod')}`.trim();
}
