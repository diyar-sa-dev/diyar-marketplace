<?php

namespace App\Services\Affiliate;

final class AffiliatePlatformConfigService
{
    /**
     * @return array{
     *     min_commission_percent: string,
     *     max_commission_percent: string,
     *     attribution_window_days: int,
     *     payout_minimum: string,
     *     currency: string
     * }
     */
    public function snapshot(): array
    {
        return [
            'min_commission_percent' => number_format($this->minCommissionPercent(), 2, '.', ''),
            'max_commission_percent' => number_format($this->maxCommissionPercent(), 2, '.', ''),
            'attribution_window_days' => $this->attributionWindowDays(),
            'payout_minimum' => number_format($this->payoutMinimum(), 2, '.', ''),
            'currency' => $this->currency(),
        ];
    }

    public function minCommissionPercent(): float
    {
        return (float) config('diyar.affiliate.platform_min_commission_percent', 1);
    }

    public function maxCommissionPercent(): float
    {
        return (float) config('diyar.affiliate.platform_max_commission_percent', 30);
    }

    public function attributionWindowDays(): int
    {
        return max(1, (int) config('diyar.affiliate.attribution_window_days', 30));
    }

    public function payoutMinimum(): float
    {
        return (float) config('diyar.affiliate.payout_minimum', 100.00);
    }

    public function currency(): string
    {
        return (string) config('diyar.affiliate.currency', 'SAR');
    }
}
