<?php

namespace App\Domains\Shipping\Services\Strategies;

use App\Domains\Shipping\Contracts\ShippingCalculatorInterface;
use App\Domains\Shipping\Services\DTO\ShippingQuote;
use App\Enums\ShippingMethod;
use App\Models\VendorShippingSettings;

interface ShippingMethodStrategy extends ShippingCalculatorInterface
{
    public function method(): ShippingMethod;

    public function quote(VendorShippingSettings $settings, string $vendorSubtotal): ShippingQuote;
}
