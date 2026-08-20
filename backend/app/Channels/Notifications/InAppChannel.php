<?php

namespace App\Channels\Notifications;

use App\Contracts\Notifications\NotificationChannelInterface;
use App\Enums\NotificationChannel;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\UserNotification;

final class InAppChannel implements NotificationChannelInterface
{
    public function channel(): NotificationChannel
    {
        return NotificationChannel::InApp;
    }

    public function deliver(
        User $recipient,
        UserNotification $notification,
        NotificationDelivery $delivery,
        array $payload,
    ): void {
        // In-app content is persisted in user_notifications before delivery runs.
    }
}
