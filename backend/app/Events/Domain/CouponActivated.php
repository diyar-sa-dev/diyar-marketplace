<?php

namespace App\Events\Domain;

use App\Domains\Notifications\Contracts\TriggersNotification;
use App\Domains\Notifications\Services\NotificationIntent;
use App\Enums\NotificationType;
use App\Models\VendorCoupon;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class CouponActivated implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly VendorCoupon $coupon,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->coupon->loadMissing('vendorAccount.user');

        return new NotificationIntent(
            type: NotificationType::CouponActivated,
            recipients: array_filter([$this->coupon->vendorAccount?->user]),
            payload: [
                'coupon_code' => $this->coupon->code,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/vendor/coupons',
            ],
            entityType: 'coupon',
            entityId: $this->coupon->id,
            dedupeKey: "coupon.activated:{$this->coupon->id}",
        );
    }
}
