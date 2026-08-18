import type { Locale } from './i18n/types.ts';

export function formatRelativeReviewDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    numeric: 'auto',
  });

  if (absSeconds < 60) {
    return rtf.format(Math.round(diffSeconds / 60) || -0, 'minute');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, 'day');
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  }

  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, 'year');
}
