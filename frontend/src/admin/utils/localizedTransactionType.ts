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

export function localizedTransactionType(type: string, t: (key: string) => string): string {
  const key = `admin.finance.transactionTypes.${type}`;
  const translated = t(key);
  return translated === key ? type.replace(/_/g, ' ') : translated;
}
