<?php

namespace App\Domains\Payments\Services\DTO;

final readonly class PaymentDetailsRequest
{
    public function __construct(
        public string $gatewayPaymentId,
        public string $expectedReference,
        public string $expectedAmount,
        public string $expectedCurrency,
    ) {}
}
