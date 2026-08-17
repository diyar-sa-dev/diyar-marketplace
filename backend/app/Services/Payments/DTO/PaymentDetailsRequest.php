<?php

namespace App\Services\Payments\DTO;

final readonly class PaymentDetailsRequest
{
    public function __construct(
        public string $gatewayPaymentId,
        public string $expectedReference,
        public string $expectedAmount,
        public string $expectedCurrency,
    ) {}
}
