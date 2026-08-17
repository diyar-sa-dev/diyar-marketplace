<?php

namespace App\Services\Finance\DTO;

use App\Enums\FinancePeriod;
use Carbon\CarbonImmutable;

final readonly class VendorFinancePeriodReport
{
    public function __construct(
        public FinancePeriod $periodType,
        public CarbonImmutable $from,
        public CarbonImmutable $to,
        public string $currency,
        public string $grossSales,
        public string $commission,
        public string $commissionBase,
        public ?string $commissionRatePercent,
        public string $refunds,
        public string $adjustments,
        public string $netEarnings,
        public string $pendingEscrow,
        public string $availableBalance,
        public string $paidOut,
        public int $completedOrders,
        public string $averageOrderValue,
        public ?string $upcomingPayoutAmount,
        public ?string $upcomingPayoutDueAt,
        public ?string $upcomingPayoutNote,
    ) {}
}
