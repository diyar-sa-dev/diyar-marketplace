<?php

namespace App\Enums;

enum ReturnRequestStatus: string
{
    case Requested = 'requested';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case AwaitingReturn = 'awaiting_return';
    case Received = 'received';
    case Inspected = 'inspected';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
