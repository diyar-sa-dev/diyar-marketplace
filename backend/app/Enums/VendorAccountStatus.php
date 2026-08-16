<?php

namespace App\Enums;

enum VendorAccountStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Suspended = 'suspended';
}
