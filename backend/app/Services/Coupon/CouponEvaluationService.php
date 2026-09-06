<?php

namespace App\Services\Coupon;

use App\Models\User;
use App\Models\VendorCoupon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

final class CouponEvaluationService
{
    public function __construct(
        private readonly VendorCouponValidationService $validation,
    ) {}

    public function assertEligible(
        VendorCoupon $coupon,
        string $vendorAccountId,
        string $eligibleSubtotal,
        ?User $user = null,
        ?CarbonInterface $at = null,
    ): void {
        $this->validation->assertValidForCheckout($coupon, $vendorAccountId, $eligibleSubtotal, $user, $at);
    }

    /**
     * @param  list<VendorCoupon>  $coupons
     */
    public function assertStackingRules(array $coupons): void
    {
        if ($coupons === []) {
            return;
        }

        $exclusiveGroups = [];
        $nonStackableCount = 0;

        foreach ($coupons as $coupon) {
            if ($coupon->exclusive_group !== null) {
                $group = $coupon->exclusive_group;
                if (isset($exclusiveGroups[$group])) {
                    Log::warning('coupon_validation_failed', ['reason' => 'exclusive_group_conflict', 'group' => $group]);
                    throw new InvalidArgumentException(__('diyar.coupons.exclusive_conflict'));
                }
                $exclusiveGroups[$group] = true;
            }

            if (! $coupon->stackable) {
                $nonStackableCount++;
            }
        }

        $maxStackable = (int) config('diyar.coupons.max_stackable_per_vendor', 1);

        if ($nonStackableCount > $maxStackable || count($coupons) > $maxStackable) {
            Log::warning('coupon_validation_failed', ['reason' => 'stack_limit', 'count' => count($coupons)]);
            throw new InvalidArgumentException(__('diyar.coupons.not_stackable'));
        }
    }
}
