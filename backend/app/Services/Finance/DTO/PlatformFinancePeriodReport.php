<?php

namespace App\Services\Finance\DTO;

use App\Enums\FinancePeriod;
use Carbon\CarbonImmutable;

final readonly class PlatformFinancePeriodReport
{
    public function __construct(
        public FinancePeriod $periodType,
        public CarbonImmutable $from,
        public CarbonImmutable $to,
        public string $currency,
        public string $grossSales,
        public string $platformCommission,
        public string $affiliateCommission,
        public string $refunds,
        public string $netEarnings,
        public string $platformEarnings,
        public string $pendingEscrow,
        public string $pendingVendorPayouts,
        public string $pendingAffiliatePayouts,
        public int $completedOrders,
        public string $averageOrderValue,
    ) {}
}
