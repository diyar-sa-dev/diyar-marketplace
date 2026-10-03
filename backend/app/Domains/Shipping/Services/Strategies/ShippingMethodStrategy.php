<?php

namespace App\Domains\Shipping\Services\Strategies;

use App\Domains\Shipping\Contracts\ShippingCalculatorInterface;
use App\Enums\ShippingMethod;
use App\Models\VendorShippingSettings;
use App\Domains\Shipping\Services\DTO\ShippingQuote;

interface ShippingMethodStrategy extends ShippingCalculatorInterface
{
    public function method(): ShippingMethod;

    public function quote(VendorShippingSettings $settings, string $vendorSubtotal): ShippingQuote;
}
