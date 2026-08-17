<?php

namespace App\Enums;

enum PaymentWebhookProcessingStatus: string
{
    case Pending = 'pending';
    case Processed = 'processed';
    case Ignored = 'ignored';
    case Failed = 'failed';
}
