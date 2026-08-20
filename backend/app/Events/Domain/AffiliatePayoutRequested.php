<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\AffiliatePayout;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class AffiliatePayoutRequested implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly AffiliatePayout $payout,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->payout->loadMissing('profile.user');

        return new NotificationIntent(
            type: NotificationType::AffiliatePayoutRequested,
            recipients: array_filter([$this->payout->profile?->user]),
            payload: [
                'reference' => $this->payout->reference,
                'amount' => (string) $this->payout->amount,
                'currency' => $this->payout->currency,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/affiliate/payouts',
            ],
            entityType: 'affiliate_payout',
            entityId: $this->payout->id,
            dedupeKey: "affiliate.payout.requested:{$this->payout->id}",
        );
    }
}
