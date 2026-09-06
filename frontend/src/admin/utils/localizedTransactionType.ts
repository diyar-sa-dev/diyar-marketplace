export const FINANCIAL_TRANSACTION_TYPES = [
  'sale',
  'platform_commission',
  'affiliate_commission',
  'refund',
  'payout',
  'escrow',
  'escrow_release',
  'adjustment',
] as const;

export type FinancialTransactionType = (typeof FINANCIAL_TRANSACTION_TYPES)[number];

export function localizedTransactionType(
  type: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!type) {
    return '—';
  }

  const key = `admin.finance.transactionTypes.${type}`;
  const translated = t(key);
  return translated === key ? type.replace(/_/g, ' ') : translated;
}

export type LedgerTone = 'credit' | 'debit' | 'gold' | 'neutral';

export function ledgerTransactionTone(
  type: string | null | undefined,
  direction?: string | null,
): LedgerTone {
  const normalized = (type ?? '').toLowerCase();

  if (normalized === 'sale' || normalized === 'escrow') {
    return 'credit';
  }

  if (normalized === 'refund' || normalized === 'payout') {
    return 'debit';
  }

  if (
    normalized === 'platform_commission' ||
    normalized === 'affiliate_commission' ||
    normalized === 'escrow_release' ||
    normalized === 'adjustment'
  ) {
    return 'gold';
  }

  if (direction === 'debit') {
    return 'debit';
  }

  if (direction === 'credit') {
    return 'credit';
  }

  return 'neutral';
}

export function ledgerTypeBadgeClass(tone: LedgerTone): string {
  switch (tone) {
    case 'credit':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
    case 'debit':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200';
    case 'gold':
      return 'bg-[#f4ead8] text-[#8a6a2f] ring-1 ring-[#e4d4b0]';
    default:
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
  }
}

export function ledgerAmountClass(tone: LedgerTone): string {
  switch (tone) {
    case 'credit':
      return 'text-emerald-700';
    case 'debit':
      return 'text-red-700';
    case 'gold':
      return 'text-diyar-brown';
    default:
      return 'text-diyar-dark';
  }
}

export function ledgerRowAccentClass(tone: LedgerTone): string {
  switch (tone) {
    case 'credit':
      return 'border-s-[3px] border-s-emerald-500';
    case 'debit':
      return 'border-s-[3px] border-s-red-500';
    case 'gold':
      return 'border-s-[3px] border-s-diyar-brown';
    default:
      return 'border-s-[3px] border-s-transparent';
  }
}
