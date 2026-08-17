<?php

namespace App\Enums;

enum CommissionScope: string
{
    case Global = 'global';
    case Category = 'category';
    case Vendor = 'vendor';
    case Product = 'product';
    case Campaign = 'campaign';
}
