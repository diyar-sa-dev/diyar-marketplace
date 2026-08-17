<?php

namespace App\Services\Shipping\Strategies;

use App\Contracts\Shipping\ShippingCalculatorInterface;
use App\Enums\ShippingMethod;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\DTO\ShippingQuote;

interface ShippingMethodStrategy extends ShippingCalculatorInterface
{
    public function method(): ShippingMethod;

    public function quote(VendorShippingSettings $settings, string $vendorSubtotal): ShippingQuote;
}
