<?php

namespace App\Services\Finance\DTO;

final readonly class VendorBalanceSummary
{
    public function __construct(
        public string $currency,
        public string $totalRevenue,
        public string $pendingEscrow,
        public string $availableBalance,
        public string $paidOut,
    ) {}
}
