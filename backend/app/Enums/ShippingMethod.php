<?php

namespace App\Enums;

enum ShippingMethod: string
{
    case Carrier = 'carrier';
    case Pickup = 'pickup';
}
