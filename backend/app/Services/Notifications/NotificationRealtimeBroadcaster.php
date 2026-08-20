<?php

namespace App\Services\Notifications;

use App\Events\Broadcast\UserNotificationCreated;
use App\Events\Broadcast\UserNotificationReadStateChanged;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;

final class NotificationRealtimeBroadcaster
{
    public function notificationCreated(UserNotification $notification): void
    {
        if (! config('diyar.notifications.realtime_enabled', true)) {
            return;
        }

        if (config('broadcasting.default') === 'null') {
            return;
        }

        try {
            $unreadCount = UserNotification::query()
                ->where('user_id', $notification->user_id)
                ->whereNull('read_at')
                ->count();

            broadcast(new UserNotificationCreated($notification, $unreadCount));
            Log::info('notifications.realtime.created', [
                'notification_id' => $notification->id,
                'user_id' => $notification->user_id,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('notifications.realtime.failed', [
                'notification_id' => $notification->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function readStateChanged(
        string $userId,
        int $unreadCount,
        string $action,
        ?string $notificationId = null,
    ): void {
        if (! config('diyar.notifications.realtime_enabled', true)) {
            return;
        }

        if (config('broadcasting.default') === 'null') {
            return;
        }

        try {
            broadcast(new UserNotificationReadStateChanged(
                $userId,
                $unreadCount,
                $action,
                $notificationId,
            ));
        } catch (\Throwable $exception) {
            Log::warning('notifications.realtime.read_state_failed', [
                'user_id' => $userId,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
