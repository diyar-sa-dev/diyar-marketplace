<?php

namespace App\Services\Coupon;

use App\Enums\VendorCouponType;
use App\Models\VendorCoupon;

final class VendorCouponCalculationService
{
    public function calculateDiscount(string $eligibleSubtotal, VendorCoupon $coupon): string
    {
        if (bccomp($eligibleSubtotal, '0.00', 2) <= 0) {
            return '0.00';
        }

        $discount = match ($coupon->type) {
            VendorCouponType::Percentage => $this->percentageDiscount($eligibleSubtotal, $coupon),
            VendorCouponType::Fixed => $this->fixedDiscount($eligibleSubtotal, $coupon),
            VendorCouponType::FreeShipping => '0.00',
        };

        if (bccomp($discount, $eligibleSubtotal, 2) > 0) {
            $discount = $eligibleSubtotal;
        }

        return $discount;
    }

    private function percentageDiscount(string $subtotal, VendorCoupon $coupon): string
    {
        $percent = (string) $coupon->value;
        $raw = bcmul($subtotal, bcdiv($percent, '100', 4), 2);

        if ($coupon->maximum_discount !== null && bccomp($raw, (string) $coupon->maximum_discount, 2) > 0) {
            return number_format((float) $coupon->maximum_discount, 2, '.', '');
        }

        return $raw;
    }

    private function fixedDiscount(string $subtotal, VendorCoupon $coupon): string
    {
        $amount = $coupon->fixed_amount ?? '0.00';

        if (bccomp((string) $amount, '0.00', 2) <= 0) {
            return '0.00';
        }

        return bccomp((string) $amount, $subtotal, 2) > 0 ? $subtotal : (string) $amount;
    }
}
