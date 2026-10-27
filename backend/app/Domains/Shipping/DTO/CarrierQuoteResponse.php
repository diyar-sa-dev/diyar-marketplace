<?php

namespace App\Domains\Shipping\DTO;

final class CarrierQuoteResponse
{
    public function __construct(
        public readonly bool $isAvailable,
        public readonly string $quotedRate,
        public readonly ?int $estimatedDaysMin = null,
        public readonly ?int $estimatedDaysMax = null,
        public readonly ?string $carrierServiceCode = null,
        public readonly ?string $errorReason = null,
    ) {}
}
