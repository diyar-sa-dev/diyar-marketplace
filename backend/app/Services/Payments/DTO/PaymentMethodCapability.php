<?php

namespace App\Services\Payments\DTO;

final readonly class PaymentMethodCapability
{
    public function __construct(
        public string $code,
        public bool $available,
        public ?string $label = null,
    ) {}
}
