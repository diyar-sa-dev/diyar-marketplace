<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ServiceBooking;
use App\Models\User;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class BookingCompleted implements TriggersNotification
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

        return new NotificationIntent(
            type: NotificationType::BookingCompleted,
            recipients: $recipients,
            payload: [
                'reference' => $this->booking->reference,
                'service_title' => $this->booking->service_title_snapshot,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/service-bookings/'.$this->booking->id,
            ],
            entityType: 'service_booking',
            entityId: $this->booking->id,
            dedupeKey: "booking.completed:{$this->booking->id}",
        );
    }
}
