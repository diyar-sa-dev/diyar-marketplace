<?php

namespace App\Enums;

enum ServicePricingMode: string
{
    case Fixed = 'fixed';
    case StartingFrom = 'starting_from';
    case Hourly = 'hourly';
    case PerSqm = 'per_sqm';
    case PerProject = 'per_project';
    case CustomQuote = 'custom_quote';
}
