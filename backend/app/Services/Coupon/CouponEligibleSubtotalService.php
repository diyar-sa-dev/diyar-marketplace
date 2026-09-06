<?php

namespace App\Services\Coupon;

use App\Enums\CouponScopeType;
use App\Models\Product;
use App\Models\VendorCoupon;
use Illuminate\Support\Collection;

final class CouponEligibleSubtotalService
{
    /**
     * @param  Collection<int, object{product: Product, quantity: int, line_subtotal?: string}>  $cartItems
     */
    public function eligibleSubtotal(VendorCoupon $coupon, Collection $cartItems, string $vendorAccountId): string
    {
        $coupon->loadMissing(['scopes', 'exclusions']);

        $total = '0.00';

        foreach ($cartItems as $item) {
            $product = $item->product;

            if ((string) $product->vendor_account_id !== $vendorAccountId) {
                continue;
            }

            if ($this->isExcluded($coupon, $product)) {
                continue;
            }

            if (! $this->isInScope($coupon, $product)) {
                continue;
            }

            $line = isset($item->line_subtotal)
                ? (string) $item->line_subtotal
                : bcmul((string) $item->product->sale_price, (string) $item->quantity, 2);

            $total = bcadd($total, $line, 2);
        }

        return $total;
    }

    private function isExcluded(VendorCoupon $coupon, $product): bool
    {
        foreach ($coupon->exclusions as $exclusion) {
            if ($exclusion->exclusion_type === 'product' && $exclusion->exclusion_id === $product->id) {
                return true;
            }

            if ($exclusion->exclusion_type === 'category' && $exclusion->exclusion_id === $product->category_id) {
                return true;
            }

            if ($exclusion->exclusion_type === 'vendor' && $exclusion->exclusion_id === $product->vendor_account_id) {
                return true;
            }
        }

        return false;
    }

    private function isInScope(VendorCoupon $coupon, $product): bool
    {
        $scopeType = $coupon->scope_type ?? CouponScopeType::All;

        if ($scopeType === CouponScopeType::All || $scopeType === CouponScopeType::Vendor) {
            return true;
        }

        if ($coupon->scopes->isEmpty()) {
            return $scopeType === CouponScopeType::All;
        }

        foreach ($coupon->scopes as $scope) {
            if ($scope->scope_type === 'category' && $scope->scope_id === $product->category_id) {
                return true;
            }

            if ($scope->scope_type === 'product' && $scope->scope_id === $product->id) {
                return true;
            }
        }

        return false;
    }
}
