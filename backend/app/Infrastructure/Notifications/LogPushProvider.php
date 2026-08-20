<?php

namespace App\Infrastructure\Notifications;

use App\Contracts\Notifications\PushProviderInterface;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;

final class LogPushProvider implements PushProviderInterface
{
    public function send(User $recipient, UserNotification $notification, array $devices, array $payload): PushSendResult
    {
        Log::info('notifications.push.delivered', [
            'user_id' => $recipient->id,
            'notification_id' => $notification->id,
            'device_count' => count($devices),
            'type' => $notification->type->value,
        ]);

        return new PushSendResult;
    }
}
