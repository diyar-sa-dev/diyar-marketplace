<?php

namespace App\Domains\Shipping\DTO;

use App\Models\Address;
use App\Models\VendorPickupAddress;

final class CarrierQuoteRequest
{
    public function __construct(
        public readonly ?VendorPickupAddress $originAddress,
        public readonly Address $destinationAddress,
        public readonly float $billableWeightKg,
        public readonly float $declaredValue = 0.0,
        public readonly ?float $lengthCm = null,
        public readonly ?float $widthCm = null,
        public readonly ?float $heightCm = null,
    ) {}
}
