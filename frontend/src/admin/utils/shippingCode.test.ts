import { describe, expect, it } from 'vitest';
import { slugifyShippingCode } from './shippingCode.ts';

describe('slugifyShippingCode', () => {
  it('slugifies latin names', () => {
    expect(slugifyShippingCode('Standard Delivery')).toBe('standard-delivery');
  });

  it('generates a stable latin fallback for arabic names', () => {
    const first = slugifyShippingCode('بتخسي', 'mth');
    const second = slugifyShippingCode('بتخسي', 'mth');

    expect(first).toMatch(/^mth-[a-z0-9]+$/);
    expect(first).toBe(second);
    expect(first).not.toBe('');
  });

  it('returns empty when there is no name to derive from', () => {
    expect(slugifyShippingCode('   ')).toBe('');
  });
});
