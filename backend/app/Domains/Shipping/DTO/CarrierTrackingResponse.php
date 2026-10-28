<?php

namespace App\Domains\Shipping\DTO;

final class CarrierTrackingResponse
{
    /**
     * @param  list<array{raw_status: string, normalized_status: string, timestamp: string, location: ?string, description: ?string}>  $milestones
     */
    public function __construct(
        public readonly string $trackingNumber,
        public readonly string $normalizedStatus, // 'pending', 'prepared', 'shipped', 'delivered', 'cancelled'
        public readonly array $milestones = [],
        public readonly ?string $rawCarrierStatus = null,
    ) {}
}
