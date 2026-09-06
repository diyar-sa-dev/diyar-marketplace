import { describe, expect, it } from 'vitest';
import {
  formatSaudiPhoneInputDisplay,
  isValidNameClient,
  isValidSaudiPhoneNational,
  maskPhoneForDisplay,
  passwordsMatch,
  sanitizeSaudiPhoneInput,
  SAUDI_PHONE_DIGITS,
} from './validation.ts';

describe('Saudi phone validation', () => {
  it('sanitizes non-digits and limits length', () => {
    expect(sanitizeSaudiPhoneInput('+966501234567')).toBe('501234567');
    expect(sanitizeSaudiPhoneInput('966501234567')).toBe('501234567');
    expect(sanitizeSaudiPhoneInput('50123456789')).toHaveLength(SAUDI_PHONE_DIGITS);
  });

  it('formats national digits for editable input display', () => {
    expect(formatSaudiPhoneInputDisplay('501234567')).toBe('+966501234567');
    expect(formatSaudiPhoneInputDisplay('')).toBe('');
  });

  it('accepts valid national numbers', () => {
    expect(isValidSaudiPhoneNational('501234567')).toBe(true);
  });

  it('rejects invalid numbers', () => {
    expect(isValidSaudiPhoneNational('401234567')).toBe(false);
    expect(isValidSaudiPhoneNational('50123456')).toBe(false);
    expect(isValidSaudiPhoneNational('+966501234567')).toBe(false);
  });
});

describe('name validation', () => {
  it('requires trimmed length between min and max', () => {
    expect(isValidNameClient('أ')).toBe(false);
    expect(isValidNameClient('  فو  ')).toBe(true);
    expect(isValidNameClient('a'.repeat(256))).toBe(false);
  });
});

describe('maskPhoneForDisplay', () => {
  it('masks phone showing first and last digit only', () => {
    expect(maskPhoneForDisplay('577777777')).toBe('5*******7');
    expect(maskPhoneForDisplay('501234567')).toBe('5*******7');
    expect(maskPhoneForDisplay('966501848484')).toBe('5*******4');
  });
});

describe('passwordsMatch', () => {
  it('requires exact match', () => {
    expect(passwordsMatch('Password123', 'Password123')).toBe(true);
    expect(passwordsMatch('Password123', 'Password124')).toBe(false);
  });
});
