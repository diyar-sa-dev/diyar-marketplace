<?php

namespace App\Enums;

enum ShippingRateMethodType: string
{
    case Flat = 'flat';
    case WeightTier = 'weight_tier';
    case DimensionTier = 'dimension_tier';
}
