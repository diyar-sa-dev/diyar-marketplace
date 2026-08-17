import type { Locale } from './i18n/types.ts';

export function formatOrderDate(value: string | undefined, locale: Locale): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatMemberSince(value: string | undefined, locale: Locale): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const monthYear = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(date);

  return locale === 'ar' ? `مشترك منذ ${monthYear}` : `Member since ${monthYear}`;
}
