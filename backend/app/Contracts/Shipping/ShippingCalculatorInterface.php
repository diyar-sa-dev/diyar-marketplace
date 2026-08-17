<?php

namespace App\Contracts\Shipping;

use App\Models\VendorShippingSettings;
use App\Services\Shipping\DTO\ShippingQuote;
use App\Services\Shipping\Strategies\ShippingMethodStrategy;

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
