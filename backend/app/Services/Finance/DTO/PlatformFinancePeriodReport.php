<?php

namespace App\Services\Finance\DTO;

use App\Enums\FinancePeriod;
use Carbon\CarbonImmutable;

final readonly class PlatformFinancePeriodReport
{
    /**
     * @param  list<array{label: string, gross_sales: string, platform_commission: string, affiliate_commission: string, net_earnings: string}>  $series
     */
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
        public string $pendingProviderPayouts,
        public string $pendingAffiliatePayouts,
        public int $completedOrders,
        public string $averageOrderValue,
        public string $granularity,
        public array $series,
    ) {}
}
