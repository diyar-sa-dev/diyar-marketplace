<?php

namespace App\Enums;

enum ProductPreorderStatus: string
{
    case Pending = 'pending';
    case Fulfilled = 'fulfilled';
    case Cancelled = 'cancelled';
}
