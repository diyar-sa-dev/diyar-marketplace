<?php

namespace App\Enums;

enum NotificationDeliveryStatus: string
{
    case Pending = 'pending';
    case Queued = 'queued';
    case Processing = 'processing';
    case Delivered = 'delivered';
    case Failed = 'failed';
    case Retrying = 'retrying';
    case Skipped = 'skipped';
    case Suppressed = 'suppressed';
    case Cancelled = 'cancelled';

    public function isTerminal(): bool
    {
        return in_array($this, [
            self::Delivered,
            self::Failed,
            self::Skipped,
            self::Suppressed,
            self::Cancelled,
        ], true);
    }
}
