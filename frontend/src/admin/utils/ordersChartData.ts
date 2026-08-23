import { intlLocaleTag } from '../../lib/intlLocale.ts';

export type OrdersChartMode = 'daily' | 'weekly';

export type OrdersChartPoint = {
  label: string;
  orders: number;
  revenue: number;
  tooltipLabel: string;
};

export type OrdersChartPeriod = {
  from: string;
  to: string;
  mode: OrdersChartMode;
  dayCount: number;
};

type DailyRow = { day: string; count: number; revenue: string };

function toIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function localeTag(locale: string): string {
  return intlLocaleTag(locale);
}

function formatDailyAxisLabel(iso: string, locale: string): string {
  return parseIsoDate(iso).toLocaleDateString(localeTag(locale), {
    weekday: 'short',
    day: 'numeric',
  });
}

function formatDailyTooltip(iso: string, locale: string): string {
  return parseIsoDate(iso).toLocaleDateString(localeTag(locale), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRangeLabel(fromIso: string, toIso: string, locale: string): string {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  const tag = localeTag(locale);
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();

  if (sameMonth) {
    const month = from.toLocaleDateString(tag, { month: 'short' });
    return `${from.getDate()}–${to.getDate()} ${month}`;
  }

  const fromLabel = from.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  const toLabel = to.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  return `${fromLabel} – ${toLabel}`;
}

function formatRangeTooltip(fromIso: string, toIso: string, locale: string): string {
  const from = formatDailyTooltip(fromIso, locale);
  const to = formatDailyTooltip(toIso, locale);
  return `${from} → ${to}`;
}

export function resolveChartPeriod(days: 7 | 30): OrdersChartPeriod {
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  return {
    from: toIsoDateLocal(start),
    to: toIsoDateLocal(end),
    mode: days <= 7 ? 'daily' : 'weekly',
    dayCount: days,
  };
}

export function formatPeriodSubtitle(period: OrdersChartPeriod, locale: string): string {
  const from = parseIsoDate(period.from);
  const to = parseIsoDate(period.to);
  const tag = localeTag(locale);
  const fromLabel = from.toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const toLabel = to.toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fromLabel} – ${toLabel}`;
}

export function buildOrdersChartData(
  rows: DailyRow[],
  period: OrdersChartPeriod,
  locale: string,
): OrdersChartPoint[] {
  const byDay = new Map(
    rows.map((row) => [
      row.day,
      { orders: row.count, revenue: Number.parseFloat(row.revenue) || 0 },
    ]),
  );

  const start = parseIsoDate(period.from);
  const end = parseIsoDate(period.to);

  if (period.mode === 'daily') {
    const points: OrdersChartPoint[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const iso = toIsoDateLocal(cursor);
      const row = byDay.get(iso);
      points.push({
        label: formatDailyAxisLabel(iso, locale),
        orders: row?.orders ?? 0,
        revenue: row?.revenue ?? 0,
        tooltipLabel: formatDailyTooltip(iso, locale),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }

  const points: OrdersChartPoint[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const bucketStart = toIsoDateLocal(cursor);
    const bucketEndDate = new Date(cursor);
    bucketEndDate.setDate(bucketEndDate.getDate() + 6);
    if (bucketEndDate > end) {
      bucketEndDate.setTime(end.getTime());
    }
    const bucketEnd = toIsoDateLocal(bucketEndDate);

    let orders = 0;
    let revenue = 0;
    const walk = new Date(cursor);
    while (walk <= bucketEndDate) {
      const iso = toIsoDateLocal(walk);
      const row = byDay.get(iso);
      orders += row?.orders ?? 0;
      revenue += row?.revenue ?? 0;
      walk.setDate(walk.getDate() + 1);
    }

    points.push({
      label: formatRangeLabel(bucketStart, bucketEnd, locale),
      orders,
      revenue,
      tooltipLabel: formatRangeTooltip(bucketStart, bucketEnd, locale),
    });

    cursor.setDate(bucketEndDate.getDate() + 1);
  }

  return points;
}
