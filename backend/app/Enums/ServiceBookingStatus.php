<?php

namespace App\Enums;

enum ServiceBookingStatus: string
{
    case PendingPayment = 'pending_payment';
    case Confirmed = 'confirmed';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
