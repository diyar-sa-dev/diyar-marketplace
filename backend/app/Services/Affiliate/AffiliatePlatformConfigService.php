<?php

namespace App\Services\Affiliate;

use App\Services\Settings\EffectiveConfigService;

final class AffiliatePlatformConfigService
{
    public function __construct(
        private readonly EffectiveConfigService $config,
    ) {}

    /**
     * @return array{
     *     min_commission_percent: string,
     *     max_commission_percent: string,
     *     attribution_window_days: int,
     *     payout_minimum: string,
     *     currency: string,
     *     payout_schedule: array{min_days: int, max_days: int}
     * }
     */
    public function snapshot(): array
    {
        $schedule = config('diyar.finance.payout_schedule', [
            'min_days' => 1,
            'max_days' => 3,
        ]);

        return [
            'min_commission_percent' => number_format($this->minCommissionPercent(), 2, '.', ''),
            'max_commission_percent' => number_format($this->maxCommissionPercent(), 2, '.', ''),
            'attribution_window_days' => $this->attributionWindowDays(),
            'payout_minimum' => number_format($this->payoutMinimum(), 2, '.', ''),
            'currency' => $this->currency(),
            'payout_schedule' => [
                'min_days' => (int) ($schedule['min_days'] ?? 1),
                'max_days' => (int) ($schedule['max_days'] ?? 3),
            ],
        ];
    }

    public function minCommissionPercent(): float
    {
        return $this->config->decimal('affiliate.platform_min_commission_percent', 1);
    }

    public function maxCommissionPercent(): float
    {
        return $this->config->decimal('affiliate.platform_max_commission_percent', 30);
    }

    public function attributionWindowDays(): int
    {
        return max(1, $this->config->integer('affiliate.attribution_window_days', 30));
    }

    public function payoutMinimum(): float
    {
        return $this->config->decimal('affiliate.payout_minimum', 100.00);
    }

    public function currency(): string
    {
        $currency = $this->config->string('commerce.currency', '');

        return $currency !== '' ? $currency : 'SAR';
    }
}
