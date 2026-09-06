<?php

namespace App\Services\Notifications;

use App\Enums\NotificationDeliveryStatus;
use App\Models\NotificationBroadcast;
use Illuminate\Support\Facades\DB;

final class NotificationBroadcastProgressService
{
    public function incrementQueued(string $broadcastId, int $count = 1): void
    {
        if ($count <= 0) {
            return;
        }

        NotificationBroadcast::query()
            ->where('id', $broadcastId)
            ->update([
                'queued_recipients' => DB::raw('queued_recipients + '.$count),
            ]);
    }

    public function recordDeliveryOutcome(?string $broadcastId, NotificationDeliveryStatus $status): void
    {
        if ($broadcastId === null || $broadcastId === '') {
            return;
        }

        $column = match ($status) {
            NotificationDeliveryStatus::Delivered => 'delivered_recipients',
            NotificationDeliveryStatus::Failed => 'failed_recipients',
            NotificationDeliveryStatus::Suppressed, NotificationDeliveryStatus::Skipped => 'suppressed_recipients',
            default => null,
        };

        if ($column === null) {
            return;
        }

        NotificationBroadcast::query()
            ->where('id', $broadcastId)
            ->update([
                $column => DB::raw("{$column} + 1"),
            ]);
    }
}
