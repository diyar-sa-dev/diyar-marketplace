<?php

namespace App\Enums;

enum CouponScopeType: string
{
    case All = 'all';
    case Category = 'category';
    case Product = 'product';
    case Vendor = 'vendor';
}
