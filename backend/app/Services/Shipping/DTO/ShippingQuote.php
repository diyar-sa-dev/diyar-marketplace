<?php

namespace App\Services\Shipping\DTO;

use App\Enums\ShippingMethod;

final readonly class ShippingQuote
{
    public function __construct(
        public ShippingMethod $method,
        public string $shippingCost,
        public bool $freeShippingApplied,
        public ?string $pickupLocationLabel,
        public ?int $deliveryEstimateDays = null,
        public ?string $billableWeightKg = null,
    ) {}
}
