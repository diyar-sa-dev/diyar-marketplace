<?php

namespace App\Domains\Payments\Services\DTO;

final readonly class PaymentSessionResult
{
    public function __construct(
        public string $sessionId,
        public string $countryCode,
        public bool $testMode,
        public string $scriptDomain,
    ) {}
}
