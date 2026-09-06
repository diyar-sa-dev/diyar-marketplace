import { describe, expect, it } from 'vitest';
import { ledgerTransactionTone, localizedTransactionType } from './localizedTransactionType.ts';

describe('localizedTransactionType', () => {
  const t = (key: string) => (key === 'admin.finance.transactionTypes.sale' ? 'Sale' : key);

  it('returns a dash when the type is missing', () => {
    expect(localizedTransactionType(undefined, t)).toBe('—');
    expect(localizedTransactionType(null, t)).toBe('—');
    expect(localizedTransactionType('', t)).toBe('—');
  });

  it('uses translated labels when available', () => {
    expect(localizedTransactionType('sale', t)).toBe('Sale');
  });

  it('falls back to a readable type when no translation exists', () => {
    expect(localizedTransactionType('escrow_release', t)).toBe('escrow release');
  });
});

describe('ledgerTransactionTone', () => {
  it('maps revenue types to credit (green)', () => {
    expect(ledgerTransactionTone('sale')).toBe('credit');
    expect(ledgerTransactionTone('escrow')).toBe('credit');
  });

  it('maps outflow types to debit (red)', () => {
    expect(ledgerTransactionTone('refund')).toBe('debit');
    expect(ledgerTransactionTone('payout')).toBe('debit');
  });

  it('maps commissions and releases to gold', () => {
    expect(ledgerTransactionTone('platform_commission')).toBe('gold');
    expect(ledgerTransactionTone('affiliate_commission')).toBe('gold');
    expect(ledgerTransactionTone('escrow_release')).toBe('gold');
  });

  it('falls back to direction when the type is unknown', () => {
    expect(ledgerTransactionTone('custom', 'credit')).toBe('credit');
    expect(ledgerTransactionTone('custom', 'debit')).toBe('debit');
    expect(ledgerTransactionTone(undefined)).toBe('neutral');
  });
});
