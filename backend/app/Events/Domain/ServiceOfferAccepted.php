<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ServiceOffer;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ServiceOfferAccepted implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly ServiceOffer $offer,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->offer->loadMissing(['providerAccount.user', 'serviceRequest']);

        return new NotificationIntent(
            type: NotificationType::OfferAccepted,
            recipients: array_filter([$this->offer->providerAccount?->user]),
            payload: [
                'request_reference' => $this->offer->serviceRequest?->reference,
                'price' => (string) $this->offer->proposed_price,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/service/requests',
            ],
            entityType: 'service_offer',
            entityId: $this->offer->id,
            dedupeKey: "offer.accepted:{$this->offer->id}",
        );
    }
}
