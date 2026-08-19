<?php

namespace App\Services\Coupon;

use App\Models\VendorCoupon;
use InvalidArgumentException;

final class CheckoutCouponService
{
    public function __construct(
        private readonly VendorCouponValidationService $validation,
        private readonly VendorCouponCalculationService $calculation,
    ) {}

    /**
     * @param  array<string, string>  $codesByVendor  vendor_account_id => coupon code
     * @return array<string, array{coupon: VendorCoupon, discount: string}>
     */
    public function resolveForVendorGroups(array $codesByVendor, array $vendorSubtotals): array
    {
        $resolved = [];

        foreach ($codesByVendor as $vendorAccountId => $code) {
            $vendorAccountId = (string) $vendorAccountId;
            $code = trim((string) $code);

            if ($code === '') {
                continue;
            }

            if (! isset($vendorSubtotals[$vendorAccountId])) {
                throw new InvalidArgumentException(__('diyar.coupons.store_mismatch'));
            }

            $coupon = $this->validation->findForVendorCheckout($vendorAccountId, $code);

            if ($coupon === null) {
                throw new InvalidArgumentException(__('diyar.coupons.invalid'));
            }

            $subtotal = $vendorSubtotals[$vendorAccountId];
            $this->validation->assertValidForCheckout($coupon, $vendorAccountId, $subtotal);
            $discount = $this->calculation->calculateDiscount($subtotal, $coupon);

            if (bccomp($discount, '0.00', 2) <= 0) {
                throw new InvalidArgumentException(__('diyar.coupons.invalid'));
            }

            $resolved[$vendorAccountId] = [
                'coupon' => $coupon,
                'discount' => $discount,
            ];
        }

        return $resolved;
    }
}
