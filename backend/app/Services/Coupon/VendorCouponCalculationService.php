<?php

namespace App\Services\Coupon;

use App\Models\VendorCoupon;

final class VendorCouponCalculationService
{
    public function calculateDiscount(string $subtotal, VendorCoupon $coupon): string
    {
        $percent = (string) $coupon->value;
        $raw = bcmul($subtotal, bcdiv($percent, '100', 4), 2);

        if ($coupon->maximum_discount !== null && bccomp($raw, (string) $coupon->maximum_discount, 2) > 0) {
            return number_format((float) $coupon->maximum_discount, 2, '.', '');
        }

        return $raw;
    }
}
