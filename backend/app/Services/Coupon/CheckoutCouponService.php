<?php

namespace App\Services\Coupon;

use App\Models\User;
use App\Models\VendorCoupon;
use Illuminate\Support\Collection;
use InvalidArgumentException;

final class CheckoutCouponService
{
    public function __construct(
        private readonly VendorCouponValidationService $validation,
        private readonly VendorCouponCalculationService $calculation,
        private readonly CouponEligibleSubtotalService $eligibleSubtotals,
        private readonly CouponEvaluationService $evaluation,
    ) {}

    /**
     * @param  array<string, string>  $codesByVendor  vendor_account_id => coupon code
     * @param  array<string, Collection>  $cartItemsByVendor
     * @return array<string, array{coupon: VendorCoupon, discount: string, eligible_subtotal: string}>
     */
    public function resolveForVendorGroups(
        array $codesByVendor,
        array $vendorSubtotals,
        array $cartItemsByVendor = [],
        ?User $user = null,
    ): array {
        $resolved = [];
        $couponsByVendor = [];

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

            $items = $cartItemsByVendor[$vendorAccountId] ?? collect();
            $eligibleSubtotal = $items->isNotEmpty()
                ? $this->eligibleSubtotals->eligibleSubtotal($coupon, $items, $vendorAccountId)
                : $vendorSubtotals[$vendorAccountId];

            $this->evaluation->assertEligible($coupon, $vendorAccountId, $eligibleSubtotal, $user);
            $discount = $this->calculation->calculateDiscount($eligibleSubtotal, $coupon);

            if (bccomp($discount, '0.00', 2) <= 0 && $coupon->type->value !== 'free_shipping') {
                throw new InvalidArgumentException(__('diyar.coupons.invalid'));
            }

            $couponsByVendor[$vendorAccountId] = $coupon;
            $resolved[$vendorAccountId] = [
                'coupon' => $coupon,
                'discount' => $discount,
                'eligible_subtotal' => $eligibleSubtotal,
            ];
        }

        foreach ($couponsByVendor as $vendorAccountId => $coupon) {
            $this->evaluation->assertStackingRules([$coupon]);
        }

        return $resolved;
    }
}
