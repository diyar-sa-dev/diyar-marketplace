<?php

namespace App\Services\Finance\DTO;

final readonly class VendorFinanceAnalyticsPoint
{
    public function __construct(
        public string $label,
        public string $netEarnings,
        public string $commission,
        public string $grossSales,
    ) {}
}
