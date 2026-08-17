<?php

namespace App\Services\Shipping;

use App\Enums\ShippingMethod;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\DTO\ShippingQuote;
use App\Services\Shipping\Strategies\CarrierFlatRateStrategy;
use App\Services\Shipping\Strategies\PickupStrategy;
use App\Services\Shipping\Strategies\ShippingMethodStrategy;
use InvalidArgumentException;

final class ShippingQuoteService
{
    /** @var array<string, ShippingMethodStrategy> */
    private array $strategies;

    public function __construct(
        ?CarrierFlatRateStrategy $carrier = null,
        ?PickupStrategy $pickup = null,
    ) {
        $carrier ??= new CarrierFlatRateStrategy;
        $pickup ??= new PickupStrategy;

        $this->strategies = [
            ShippingMethod::Carrier->value => $carrier,
            ShippingMethod::Pickup->value => $pickup,
        ];
    }

    public function quoteVendorGroup(
        VendorShippingSettings $settings,
        ShippingMethod $method,
        string $vendorSubtotal,
    ): ShippingQuote {
        $strategy = $this->strategies[$method->value] ?? null;

        if ($strategy === null) {
            throw new InvalidArgumentException(__('diyar.shipping.invalid_method'));
        }

        return $strategy->quote($settings, $vendorSubtotal);
    }

    /**
     * @return list<ShippingMethod>
     */
    public function availableMethods(VendorShippingSettings $settings): array
    {
        $methods = [];

        if ($settings->carrier_enabled) {
            $methods[] = ShippingMethod::Carrier;
        }

        if ($settings->pickup_enabled) {
            $methods[] = ShippingMethod::Pickup;
        }

        return $methods;
    }
}
