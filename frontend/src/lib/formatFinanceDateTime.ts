import type { Locale } from './i18n/types.ts';

export function formatFinanceDateTime(value: string | undefined, locale: Locale): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const localeTag = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB';

  const datePart = new Intl.DateTimeFormat(localeTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return locale === 'ar' ? `${datePart}، ${timePart}` : `${datePart}, ${timePart}`;
}
