<?php

namespace App\Services\Coupon;

use App\Models\User;
use App\Models\VendorCoupon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Log;
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
            ->with(['scopes', 'exclusions'])
            ->where('vendor_account_id', $vendorAccountId)
            ->where('code', $normalized)
            ->first();
    }

    public function assertValidForCheckout(
        VendorCoupon $coupon,
        string $vendorAccountId,
        string $subtotal,
        ?User $user = null,
        ?CarbonInterface $at = null,
    ): void {
        if (! config('diyar.features.coupons_enabled', true)) {
            Log::warning('coupon_validation_failed', ['reason' => 'feature_disabled']);
            throw new InvalidArgumentException(__('diyar.coupons.invalid'));
        }

        if ($coupon->vendor_account_id !== $vendorAccountId) {
            throw new InvalidArgumentException(__('diyar.coupons.store_mismatch'));
        }

        if (! $coupon->is_active) {
            throw new InvalidArgumentException(__('diyar.coupons.inactive'));
        }

        $now = $at ?? now();

        if ($coupon->starts_at !== null && $now->lt($coupon->starts_at)) {
            throw new InvalidArgumentException(__('diyar.coupons.not_started'));
        }

        if ($coupon->ends_at !== null && $now->gt($coupon->ends_at)) {
            throw new InvalidArgumentException(__('diyar.coupons.expired'));
        }

        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            Log::warning('coupon_limit_reached', ['coupon_id' => $coupon->id, 'scope' => 'global']);
            throw new InvalidArgumentException(__('diyar.coupons.usage_exhausted'));
        }

        if ($user !== null && $coupon->usage_limit_per_user !== null) {
            $userUsageCount = $coupon->usages()->where('user_id', $user->id)->count();
            if ($userUsageCount >= $coupon->usage_limit_per_user) {
                Log::warning('coupon_limit_reached', ['coupon_id' => $coupon->id, 'scope' => 'user', 'user_id' => $user->id]);
                throw new InvalidArgumentException(__('diyar.coupons.user_limit_exhausted'));
            }
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

    public function revalidateBeforeUsage(VendorCoupon $coupon, User $user): void
    {
        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            Log::warning('coupon_redemption_conflict', ['coupon_id' => $coupon->id]);
            throw new InvalidArgumentException(__('diyar.coupons.usage_exhausted'));
        }

        if ($coupon->usage_limit_per_user !== null) {
            $userUsageCount = $coupon->usages()->where('user_id', $user->id)->lockForUpdate()->count();
            if ($userUsageCount >= $coupon->usage_limit_per_user) {
                Log::warning('coupon_redemption_conflict', ['coupon_id' => $coupon->id, 'user_id' => $user->id]);
                throw new InvalidArgumentException(__('diyar.coupons.user_limit_exhausted'));
            }
        }
    }
}
