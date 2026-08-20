<?php

namespace App\Enums;

enum AffiliateCommissionStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Available = 'available';
    case Reversed = 'reversed';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
}
