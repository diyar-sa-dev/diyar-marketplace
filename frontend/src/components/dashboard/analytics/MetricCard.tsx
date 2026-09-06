import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';
import { formatLocaleNumber } from '../../../lib/intlLocale.ts';
import { formatPercent } from '../../../lib/formatMoney.ts';

export type MetricTrend = {
  value: number | string;
  change_percent?: number | null;
};

type MetricCardProps = {
  label: string;
  value: number | string | MetricTrend;
  icon?: ReactNode;
  iconClassName?: string;
  hint?: string;
  to?: string;
  formatValue?: (value: number | string) => string;
  className?: string;
};

export function MetricCard({
  label,
  value,
  icon,
  iconClassName = 'bg-[#f7f4f1] text-diyar-brown',
  hint,
  to,
  formatValue,
  className = '',
}: MetricCardProps) {
  const { locale } = useLocale();

  const resolved: MetricTrend =
    typeof value === 'object' && value !== null && 'value' in value
      ? (value as MetricTrend)
      : { value: value as string | number, change_percent: null };

  const displayValue = formatValue
    ? formatValue(resolved.value)
    : typeof resolved.value === 'number'
      ? formatLocaleNumber(resolved.value, locale)
      : resolved.value;

  const trend = resolved.change_percent;
  const trendPositive = trend != null && trend >= 0;

  const body = (
    <div className="flex h-full min-h-28 items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-500 sm:text-sm">{label}</p>
        <p className="mt-2 text-2xl font-extrabold text-diyar-dark tabular-nums sm:text-3xl" dir="ltr">
          {displayValue}
        </p>
        {trend != null ? (
          <p
            className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
              trendPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
            dir="ltr"
          >
            {trendPositive ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
            <span>{formatPercent(trend, locale)}</span>
          </p>
        ) : null}
        {hint ? <p className="mt-1 line-clamp-2 text-[11px] text-gray-500 sm:text-xs">{hint}</p> : null}
      </div>
      {icon ? <div className={`shrink-0 rounded-xl p-2.5 ${iconClassName}`}>{icon}</div> : null}
    </div>
  );

  const cardClass = `h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5${to ? ' transition hover:border-diyar-brown/30 hover:shadow-md' : ''} ${className}`;

  if (to) {
    return (
      <Link to={to} className={`group block ${cardClass}`}>
        {body}
      </Link>
    );
  }

  return <div className={cardClass}>{body}</div>;
}
