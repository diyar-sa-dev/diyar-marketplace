<?php

namespace App\Domains\Shipping\Contracts;

use App\Domains\Shipping\Services\DTO\ShippingQuote;
use App\Domains\Shipping\Services\Strategies\ShippingMethodStrategy;
use App\Models\VendorShippingSettings;

/**
 * V1 local shipping quote contract (flat rate, pickup, free threshold).
 *
 * {@see ShippingProviderInterface} is the future boundary for live carrier APIs.
 * {@see ShippingMethodStrategy} is the active strategy interface.
 */
interface ShippingCalculatorInterface
{
    public function quote(VendorShippingSettings $settings, string $vendorSubtotal): ShippingQuote;
}
