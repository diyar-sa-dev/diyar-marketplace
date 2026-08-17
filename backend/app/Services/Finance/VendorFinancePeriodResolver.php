<?php

namespace App\Services\Finance;

use App\Enums\FinancePeriod;
use Carbon\CarbonImmutable;

final class VendorFinancePeriodResolver
{
    /**
     * @return array{type: FinancePeriod, from: CarbonImmutable, to: CarbonImmutable}
     */
    public function resolve(FinancePeriod $period, ?CarbonImmutable $now = null): array
    {
        $now = ($now ?? CarbonImmutable::now())->startOfSecond();
        $to = $now->endOfDay();

        $from = match ($period) {
            FinancePeriod::Day => $now->startOfDay(),
            FinancePeriod::Week => $now->subDays(6)->startOfDay(),
            FinancePeriod::Month => $now->startOfMonth(),
            FinancePeriod::Year => $now->startOfYear(),
        };

        return [
            'type' => $period,
            'from' => $from,
            'to' => $to,
        ];
    }
}
