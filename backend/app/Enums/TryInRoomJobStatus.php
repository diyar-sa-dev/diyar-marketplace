<?php

namespace App\Enums;

enum TryInRoomJobStatus: string
{
    case Queued = 'queued';
    case Processing = 'processing';
    case Completed = 'completed';
    case Failed = 'failed';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Queued => in_array($next, [self::Processing, self::Failed], true),
            self::Processing => in_array($next, [self::Completed, self::Failed], true),
            self::Completed, self::Failed => false,
        };
    }
}
