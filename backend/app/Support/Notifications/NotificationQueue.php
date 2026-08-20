<?php

namespace App\Support\Notifications;

use App\Enums\NotificationPriority;

final class NotificationQueue
{
    public static function forPriority(NotificationPriority $priority): string
    {
        $queues = config('diyar.notifications.queues', []);

        return match ($priority) {
            NotificationPriority::Critical,
            NotificationPriority::High => is_string($queues['high'] ?? null)
                ? $queues['high']
                : 'notifications-high',
            NotificationPriority::Low => is_string($queues['low'] ?? null)
                ? $queues['low']
                : 'notifications-low',
            default => is_string($queues['normal'] ?? null)
                ? $queues['normal']
                : 'notifications',
        };
    }
}
