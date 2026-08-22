<?php

namespace App\Services\Admin;

use App\Events\Domain\CouponActivated;
use App\Events\Domain\CouponDeactivated;
use App\Models\User;
use App\Models\VendorCoupon;
use Illuminate\Support\Facades\DB;

final class AdminCouponService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function activate(VendorCoupon $coupon, User $actor, ?string $reason = null): VendorCoupon
    {
        return $this->setActive($coupon, $actor, true, $reason);
    }

    public function deactivate(VendorCoupon $coupon, User $actor, ?string $reason = null): VendorCoupon
    {
        return $this->setActive($coupon, $actor, false, $reason);
    }

    private function setActive(VendorCoupon $coupon, User $actor, bool $active, ?string $reason): VendorCoupon
    {
        if ((bool) $coupon->is_active === $active) {
            return $coupon;
        }

        return DB::transaction(function () use ($coupon, $actor, $active, $reason): VendorCoupon {
            $before = ['is_active' => (bool) $coupon->is_active];
            $coupon->update(['is_active' => $active]);
            $fresh = $coupon->fresh(['vendorAccount']);

            DB::afterCommit(fn () => event(
                $active ? new CouponActivated($fresh) : new CouponDeactivated($fresh),
            ));

            $this->audit->record(
                actor: $actor,
                action: $active ? 'coupon.activate' : 'coupon.deactivate',
                resource: $coupon,
                before: $before,
                after: ['is_active' => $active],
                reason: $reason,
            );

            return $fresh;
        });
    }
}
