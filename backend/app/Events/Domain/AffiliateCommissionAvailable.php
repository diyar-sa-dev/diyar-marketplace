<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\AffiliateCommission;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class AffiliateCommissionAvailable implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly AffiliateCommission $commission,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->commission->loadMissing(['profile.user', 'product:id,name']);

        return new NotificationIntent(
            type: NotificationType::AffiliateCommissionAvailable,
            recipients: array_filter([$this->commission->profile?->user]),
            payload: [
                'amount' => (string) $this->commission->commission_amount,
                'currency' => $this->commission->currency,
                'product_name' => $this->commission->product?->name,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/affiliate',
            ],
            entityType: 'affiliate_commission',
            entityId: $this->commission->id,
            dedupeKey: "affiliate.commission.available:{$this->commission->id}",
        );
    }
}
