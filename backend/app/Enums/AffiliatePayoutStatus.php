<?php

namespace App\Enums;

enum AffiliatePayoutStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Processing = 'processing';
    case Paid = 'paid';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
