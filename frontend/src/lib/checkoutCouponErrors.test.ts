import { describe, expect, it } from 'vitest';
import { isCheckoutCouponError } from './checkoutCouponErrors.ts';

describe('isCheckoutCouponError', () => {
  it('detects Arabic coupon errors', () => {
    expect(isCheckoutCouponError('رمز الكوبون غير صالح.')).toBe(true);
  });

  it('detects English coupon errors', () => {
    expect(isCheckoutCouponError('Invalid coupon code.')).toBe(true);
  });

  it('ignores unrelated preview errors', () => {
    expect(isCheckoutCouponError('Vendor shipping is not configured.')).toBe(false);
  });
});
