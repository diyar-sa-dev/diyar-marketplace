import type { Locale } from './i18n/types.ts';

export function formatRelativeOfferDay(value: string | undefined, locale: Locale): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return locale === 'ar' ? 'اليوم' : 'Today';
  }

  if (diffDays === 1) {
    return locale === 'ar' ? 'أمس' : 'Yesterday';
  }

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatServiceRequestReference(reference: string): string {
  return reference.startsWith('#') ? reference : `#${reference}`;
}
