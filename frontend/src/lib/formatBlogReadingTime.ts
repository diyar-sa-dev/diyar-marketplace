import type { Locale } from './i18n/types.ts';

export function formatBlogReadingTime(minutes: number | null | undefined, locale: Locale): string {
  const safeMinutes = Math.max(1, minutes ?? 1);

  if (locale === 'ar') {
    return `${safeMinutes} دقائق قراءة`;
  }

  return `${safeMinutes} min read`;
}
