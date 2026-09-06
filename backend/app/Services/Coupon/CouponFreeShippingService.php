<?php

namespace App\Services\Coupon;

use App\Enums\ShippingMethod;
use App\Enums\VendorCouponType;
use App\Models\VendorCoupon;
use InvalidArgumentException;

final class CouponFreeShippingService
{
    /**
     * @return array{shipping_cost: string, shipping_discount: string, free_shipping_from_coupon: bool}
     */
    public function applyToVendorShipping(
        VendorCoupon $coupon,
        ShippingMethod $method,
        string $quotedShippingCost,
    ): array {
        if ($coupon->type !== VendorCouponType::FreeShipping) {
            return [
                'shipping_cost' => $quotedShippingCost,
                'shipping_discount' => '0.00',
                'free_shipping_from_coupon' => false,
            ];
        }

        if ($method !== ShippingMethod::Carrier) {
            throw new InvalidArgumentException(__('diyar.coupons.free_shipping_requires_carrier'));
        }

        if (bccomp($quotedShippingCost, '0.00', 2) <= 0) {
            return [
                'shipping_cost' => '0.00',
                'shipping_discount' => '0.00',
                'free_shipping_from_coupon' => false,
            ];
        }

        return [
            'shipping_cost' => '0.00',
            'shipping_discount' => $quotedShippingCost,
            'free_shipping_from_coupon' => true,
        ];
    }
}
