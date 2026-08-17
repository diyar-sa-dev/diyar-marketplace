<?php

namespace App\Services\Payments\DTO;

final readonly class RefundPaymentRequest
{
    public function __construct(
        public string $gatewayPaymentId,
        public string $paymentReference,
        public string $amount,
        public string $currency,
        public string $refundReference,
        public ?string $reason = null,
    ) {}
}
