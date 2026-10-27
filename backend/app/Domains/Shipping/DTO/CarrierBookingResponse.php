<?php

namespace App\Domains\Shipping\DTO;

final class CarrierBookingResponse
{
    public function __construct(
        public readonly bool $isSuccess,
        public readonly string $bookingStatus, // 'confirmed', 'unknown_outcome', 'failed'
        public readonly ?string $externalShipmentId = null,
        public readonly ?string $trackingNumber = null,
        public readonly ?string $labelUrl = null,
        public readonly string $invoicedCost = '0.00',
        public readonly ?string $errorMessage = null,
    ) {}
}
