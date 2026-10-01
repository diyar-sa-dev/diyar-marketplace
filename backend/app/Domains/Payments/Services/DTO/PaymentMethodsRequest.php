<?php

namespace App\Domains\Payments\Services\DTO;

final readonly class PaymentMethodsRequest
{
    public function __construct(
        public string $amount,
        public string $currency,
        public bool $applePayEnabled,
    ) {}
}
