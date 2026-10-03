<?php

namespace App\Domains\Notifications\Contracts;

use App\Enums\NotificationChannel;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\UserNotification;

interface NotificationChannelInterface
{
    public function channel(): NotificationChannel;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function deliver(
        User $recipient,
        UserNotification $notification,
        NotificationDelivery $delivery,
        array $payload,
    ): void;
}
