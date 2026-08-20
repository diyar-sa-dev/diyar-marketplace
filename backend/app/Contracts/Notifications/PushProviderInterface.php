<?php

namespace App\Contracts\Notifications;

use App\Infrastructure\Notifications\PushSendResult;
use App\Models\NotificationDevice;
use App\Models\User;
use App\Models\UserNotification;

interface PushProviderInterface
{
    /**
     * @param  list<NotificationDevice>  $devices
     * @param  array<string, mixed>  $payload
     */
    public function send(
        User $recipient,
        UserNotification $notification,
        array $devices,
        array $payload,
    ): PushSendResult;
}
