<?php

namespace App\Services\Payments\DTO;

final readonly class RefundPaymentResult
{
    public function __construct(
        public string $gatewayRefundId,
        public string $amount,
        public string $currency,
        public bool $success,
        public ?string $failureReason = null,
    ) {}
}
