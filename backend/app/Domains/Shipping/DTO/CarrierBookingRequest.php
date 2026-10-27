<?php

namespace App\Domains\Shipping\DTO;

use App\Models\Address;
use App\Models\VendorPickupAddress;

final class CarrierBookingRequest
{
    public function __construct(
        public readonly string $vendorOrderId,
        public readonly string $idempotencyKey,
        public readonly ?VendorPickupAddress $pickupAddress,
        public readonly Address $deliveryAddress,
        public readonly float $parcelWeightKg,
        public readonly float $declaredValue = 0.0,
        public readonly ?string $description = null,
    ) {}
}
