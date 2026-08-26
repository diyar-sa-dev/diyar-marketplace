import type { Locale } from './i18n/types.ts';
import { formatLocaleDate } from './intlLocale.ts';

/** Formats API cohort keys like `2026-08` into a localized month label. */
export function formatCohortMonth(value: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return value;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatLocaleDate(date, locale, { month: 'long', year: 'numeric' });
}

/** Short label for chart legends (e.g. Aug 2026 / أغسطس 2026). */
export function formatCohortMonthShort(value: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return value;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatLocaleDate(date, locale, { month: 'short', year: 'numeric' });
}
