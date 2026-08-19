<?php

namespace App\Services\Coupon;

use App\Models\VendorCoupon;
use Carbon\CarbonInterface;
use InvalidArgumentException;

final class VendorCouponValidationService
{
    public function findForVendorCheckout(string $vendorAccountId, string $code): ?VendorCoupon
    {
        $normalized = VendorCoupon::normalizeCode($code);

        if ($normalized === '') {
            return null;
        }

        return VendorCoupon::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->where('code', $normalized)
            ->first();
    }

    public function assertValidForCheckout(VendorCoupon $coupon, string $vendorAccountId, string $subtotal): void
    {
        if ($coupon->vendor_account_id !== $vendorAccountId) {
            throw new InvalidArgumentException(__('diyar.coupons.store_mismatch'));
        }

        if (! $coupon->is_active) {
            throw new InvalidArgumentException(__('diyar.coupons.inactive'));
        }

        $now = now();

        if ($coupon->starts_at !== null && $now->lt($coupon->starts_at)) {
            throw new InvalidArgumentException(__('diyar.coupons.not_started'));
        }

        if ($coupon->ends_at !== null && $now->gt($coupon->ends_at)) {
            throw new InvalidArgumentException(__('diyar.coupons.expired'));
        }

        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            throw new InvalidArgumentException(__('diyar.coupons.usage_exhausted'));
        }

        if (bccomp($subtotal, (string) $coupon->minimum_order, 2) < 0) {
            throw new InvalidArgumentException(__('diyar.coupons.minimum_not_met'));
        }
    }

    public function effectiveStatus(VendorCoupon $coupon, ?CarbonInterface $at = null): string
    {
        $at ??= now();

        if (! $coupon->is_active) {
            return 'inactive';
        }

        if ($coupon->starts_at !== null && $at->lt($coupon->starts_at)) {
            return 'scheduled';
        }

        if ($coupon->ends_at !== null && $at->gt($coupon->ends_at)) {
            return 'expired';
        }

        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            return 'exhausted';
        }

        return 'active';
    }
}
