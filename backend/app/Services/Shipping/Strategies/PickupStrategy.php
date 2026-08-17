<?php

namespace App\Services\Shipping\Strategies;

use App\Enums\ShippingMethod;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\DTO\ShippingQuote;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class PickupStrategy implements ShippingMethodStrategy
{
    public function method(): ShippingMethod
    {
        return ShippingMethod::Pickup;
    }

    public function quote(VendorShippingSettings $settings, string $vendorSubtotal): ShippingQuote
    {
        if (! $settings->pickup_enabled) {
            throw new UnprocessableEntityHttpException(__('diyar.shipping.method_not_available'));
        }

        return new ShippingQuote(
            method: ShippingMethod::Pickup,
            shippingCost: '0.00',
            freeShippingApplied: false,
            pickupLocationLabel: $settings->pickup_location_label,
        );
    }
}
