import type { Locale } from './i18n/types.ts';
import { formatLocaleDate } from './intlLocale.ts';

export type AnalyticsChartGranularity = 'hour' | 'day' | 'week' | 'month' | string;

function parseIsoDateParts(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = match[3] ? Number(match[3]) : 1;
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDayMonth(value: string, locale: Locale): string {
  const date = parseIsoDateParts(value);
  if (!date) {
    return value;
  }

  return formatLocaleDate(date, locale, { day: 'numeric', month: 'short' });
}

export function formatAnalyticsAxisLabel(
  label: string,
  locale: Locale,
  granularity: AnalyticsChartGranularity = 'day',
): string {
  if (granularity === 'hour') {
    return label;
  }

  if (granularity === 'weekday') {
    const date = parseIsoDateParts(label);
    if (!date) {
      return label;
    }

    return formatLocaleDate(date, locale, { weekday: 'short' });
  }

  if (granularity === 'week' && label.includes('—')) {
    const [start, end] = label.split('—').map((part) => part.trim());
    return `${formatDayMonth(start, locale)} – ${formatDayMonth(end, locale)}`;
  }

  if (granularity === 'month') {
    const date = parseIsoDateParts(label);
    if (!date) {
      return label;
    }

    return formatLocaleDate(date, locale, { month: 'short', year: 'numeric' });
  }

  return formatDayMonth(label, locale);
}

export function analyticsAxisTickInterval(pointCount: number): number {
  if (pointCount <= 8) {
    return 0;
  }

  return Math.max(0, Math.ceil(pointCount / 7) - 1);
}
