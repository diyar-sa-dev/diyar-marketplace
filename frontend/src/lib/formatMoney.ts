import type { Locale } from './i18n/types.ts';
import { formatLocaleNumber } from './intlLocale.ts';

export function formatMoney(
  amount: number | string,
  locale: Locale,
  currency = 'SAR',
  options?: Intl.NumberFormatOptions,
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) {
    return '—';
  }

  return `${formatLocaleNumber(value, locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })} ${currency}`;
}

export function formatPercent(value: number | null | undefined, locale: Locale): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatLocaleNumber(value, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}
