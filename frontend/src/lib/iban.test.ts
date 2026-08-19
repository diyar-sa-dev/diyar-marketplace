import { describe, expect, it } from 'vitest';
import { isValidSaudiIban, normalizeIban, saudiIbanValidationMessage } from './iban.ts';

describe('saudi IBAN validation', () => {
  it('accepts a valid 24-character Saudi IBAN', () => {
    expect(isValidSaudiIban('SA4420000001234567891234')).toBe(true);
  });

  it('rejects incomplete IBANs', () => {
    expect(isValidSaudiIban('SA442000000123456789')).toBe(false);
    expect(saudiIbanValidationMessage('SA442000000123456789', 'en')).toMatch(/24 characters/);
  });

  it('normalizes spaces and case', () => {
    expect(normalizeIban('sa44 2000 0001 2345 6789 1234')).toBe('SA4420000001234567891234');
  });
});
