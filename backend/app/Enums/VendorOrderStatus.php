<?php

namespace App\Enums;

enum VendorOrderStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}
