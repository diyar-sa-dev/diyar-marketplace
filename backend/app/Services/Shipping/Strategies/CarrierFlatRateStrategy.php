<?php

namespace App\Services\Shipping\Strategies;

use App\Enums\ShippingMethod;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\DTO\ShippingQuote;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class CarrierFlatRateStrategy implements ShippingMethodStrategy
{
    public function method(): ShippingMethod
    {
        return ShippingMethod::Carrier;
    }

    public function quote(VendorShippingSettings $settings, string $vendorSubtotal): ShippingQuote
    {
        if (! $settings->carrier_enabled) {
            throw new UnprocessableEntityHttpException(__('diyar.shipping.method_not_available'));
        }

        $rate = bcadd((string) ($settings->carrier_flat_rate ?? '0'), '0', 2);
        $cost = $rate;

        $freeApplied = false;
        if ($settings->carrier_free_shipping_enabled) {
            $threshold = bcadd((string) ($settings->carrier_free_shipping_threshold ?? '0'), '0', 2);
            if (bccomp($vendorSubtotal, $threshold, 2) >= 0) {
                $cost = '0.00';
                $freeApplied = true;
            }
        }

        return new ShippingQuote(
            method: ShippingMethod::Carrier,
            shippingCost: $cost,
            freeShippingApplied: $freeApplied,
            pickupLocationLabel: null,
        );
    }
}
