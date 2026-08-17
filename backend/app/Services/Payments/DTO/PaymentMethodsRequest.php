<?php

namespace App\Services\Payments\DTO;

final readonly class PaymentMethodsRequest
{
    public function __construct(
        public string $amount,
        public string $currency,
        public bool $applePayEnabled,
    ) {}
}
