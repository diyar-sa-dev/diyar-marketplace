<?php

namespace App\Services\Payments\DTO;

final readonly class PaymentSessionResult
{
    public function __construct(
        public string $sessionId,
        public string $countryCode,
        public bool $testMode,
        public string $scriptDomain,
    ) {}
}
