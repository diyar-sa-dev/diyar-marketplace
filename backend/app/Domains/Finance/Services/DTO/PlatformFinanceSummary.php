<?php

namespace App\Domains\Finance\Services\DTO;

final readonly class PlatformFinanceSummary
{
    public function __construct(
        public string $currency,
        public string $platformEarnings,
        public string $pendingEscrow,
        public string $pendingVendorPayouts,
        public string $pendingAffiliatePayouts,
    ) {}
}
