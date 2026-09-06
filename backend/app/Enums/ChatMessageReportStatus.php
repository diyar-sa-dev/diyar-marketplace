<?php

namespace App\Enums;

enum ChatMessageReportStatus: string
{
    case Pending = 'pending';
    case UnderReview = 'under_review';
    case Dismissed = 'dismissed';
    case Actioned = 'actioned';
    case Resolved = 'resolved';

    public function isTerminal(): bool
    {
        return in_array($this, [self::Dismissed, self::Actioned, self::Resolved], true);
    }
}
