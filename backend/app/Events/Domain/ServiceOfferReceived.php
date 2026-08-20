<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ServiceOffer;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ServiceOfferReceived implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly ServiceOffer $offer,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->offer->loadMissing(['serviceRequest.user', 'providerAccount']);

        return new NotificationIntent(
            type: NotificationType::OfferReceived,
            recipients: array_filter([$this->offer->serviceRequest?->user]),
            payload: [
                'provider_name' => $this->offer->providerAccount?->business_name,
                'price' => (string) $this->offer->proposed_price,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/service-requests/'.$this->offer->service_request_id,
            ],
            entityType: 'service_offer',
            entityId: $this->offer->id,
            dedupeKey: "offer.received:{$this->offer->id}",
        );
    }
}
