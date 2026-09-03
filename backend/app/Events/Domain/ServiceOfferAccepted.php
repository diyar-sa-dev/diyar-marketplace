<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ServiceOffer;
use App\Services\Notifications\NotificationIntent;
use App\Support\Notifications\NotificationUrlSupport;
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
        $this->offer->loadMissing(['providerAccount.user', 'serviceRequest', 'booking']);

        $booking = $this->offer->booking;
        $serviceTitle = trim((string) ($booking?->service_title_snapshot
            ?: $this->offer->serviceRequest?->title
            ?: ''));

        return new NotificationIntent(
            type: NotificationType::OfferAccepted,
            recipients: array_filter([$this->offer->providerAccount?->user]),
            payload: [
                'request_reference' => $this->offer->serviceRequest?->reference,
                'booking_reference' => $booking?->reference,
                'booking_id' => $booking?->id,
                'service_title' => $serviceTitle,
                'price' => (string) $this->offer->proposed_price,
                'action_url' => NotificationUrlSupport::providerBookingsUrl($booking?->id),
            ],
            entityType: $booking?->id ? 'service_booking' : 'service_offer',
            entityId: $booking?->id ?? $this->offer->id,
            dedupeKey: "offer.accepted:{$this->offer->id}",
        );
    }
}
