<?php

namespace App\Services\Loyalty;

use App\Services\Settings\EffectiveConfigService;

/**
 * Centralized loyalty earning rules.
 *
 * Default: floor(eligible_amount / sar_per_point) * points_per_unit
 * Example: 50 SAR per point, 1 point per unit → 149 SAR = 2 points.
 *
 * Monetary math uses BCMath on normalized decimal strings — never floats.
 */
final class LoyaltyRuleService
{
    public function __construct(
        private readonly EffectiveConfigService $config,
    ) {}

    public function isEnabled(): bool
    {
        return $this->config->boolean('commerce.loyalty_enabled', true);
    }

    public function sarPerPoint(): int
    {
        return max(1, $this->config->integer('commerce.loyalty_sar_per_point', 50));
    }

    public function pointsPerUnit(): int
    {
        return max(1, $this->config->integer('commerce.loyalty_points_per_unit', 1));
    }

    public function maxAdjustmentPoints(): int
    {
        return max(1, (int) config('diyar.loyalty.max_adjustment_points', 100_000));
    }

    public function calculatePoints(float|string $eligibleAmount): int
    {
        if (! $this->isEnabled()) {
            return 0;
        }

        $amount = $this->normalizeMoney($eligibleAmount);

        if (bccomp($amount, '0', 2) <= 0) {
            return 0;
        }

        $units = (int) bcdiv($amount, (string) $this->sarPerPoint(), 0);

        return $units * $this->pointsPerUnit();
    }

    public function calculateReversalPoints(
        int $earnedPoints,
        float|string $originalEligibleAmount,
        float|string $refundedAmount,
    ): int {
        if ($earnedPoints <= 0) {
            return 0;
        }

        $original = $this->normalizeMoney($originalEligibleAmount);
        $refunded = $this->normalizeMoney($refundedAmount);

        if (bccomp($original, '0', 2) <= 0 || bccomp($refunded, '0', 2) <= 0) {
            return 0;
        }

        if (bccomp($refunded, $original, 2) >= 0) {
            return $earnedPoints;
        }

        $product = bcmul(
            (string) $earnedPoints,
            bcdiv($refunded, $original, 8),
            8,
        );

        return (int) bcdiv($product, '1', 0);
    }

    private function normalizeMoney(float|string $amount): string
    {
        if (is_string($amount)) {
            $trimmed = trim($amount);

            if ($trimmed === '' || ! is_numeric($trimmed)) {
                return '0.00';
            }

            return bcadd($trimmed, '0', 2);
        }

        return bcadd((string) $amount, '0', 2);
    }
}
