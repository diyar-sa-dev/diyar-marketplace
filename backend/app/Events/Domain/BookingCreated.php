<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ServiceBooking;
use App\Models\User;
use App\Services\Notifications\NotificationContextBuilder;
use App\Services\Notifications\NotificationIntent;
use App\Support\Notifications\NotificationUrlSupport;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class BookingCreated implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly ServiceBooking $booking,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->booking->loadMissing(['user', 'providerAccount.user']);

        /** @var list<User> $recipients */
        $recipients = array_values(array_filter([
            $this->booking->user,
            $this->booking->providerAccount?->user,
        ]));

        $builder = app(NotificationContextBuilder::class);

        return new NotificationIntent(
            type: NotificationType::BookingCreated,
            recipients: $recipients,
            payload: [
                'reference' => $this->booking->reference,
                'service_title' => $builder->bookingServiceTitle($this->booking),
                'customer_name' => (string) ($this->booking->user?->name ?? ''),
                'provider_name' => (string) ($this->booking->providerAccount?->business_name ?? ''),
                'detail_lines' => $builder->bookingDetailLines($this->booking),
                'action_url' => NotificationUrlSupport::serviceBookingCanonicalUrl((string) $this->booking->id),
            ],
            entityType: 'service_booking',
            entityId: $this->booking->id,
            dedupeKey: "booking.created:{$this->booking->id}",
        );
    }
}
