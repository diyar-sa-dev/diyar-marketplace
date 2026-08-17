<?php

namespace App\Enums;

enum PaymentAttemptStatus: string
{
    case Pending = 'pending';
    case SessionCreated = 'session_created';
    case Submitted = 'submitted';
    case Paid = 'paid';
    case Failed = 'failed';
    case Expired = 'expired';
}
