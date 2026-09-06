<?php

namespace App\Enums;

enum DomainOutboxEventStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Processed = 'processed';
    case Failed = 'failed';
    case DeadLetter = 'dead_letter';

    public function isTerminal(): bool
    {
        return in_array($this, [self::Processed, self::DeadLetter], true);
    }
}
