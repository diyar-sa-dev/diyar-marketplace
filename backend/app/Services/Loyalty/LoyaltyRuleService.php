<?php

namespace App\Services\Loyalty;

use App\Services\Settings\EffectiveConfigService;

/**
 * Centralized loyalty earning rules.
 *
 * Default: floor(eligible_amount / sar_per_point) * points_per_unit
 * Example: 50 SAR per point, 1 point per unit → 149 SAR = 2 points.
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

    public function calculatePoints(float|string $eligibleAmount): int
    {
        if (! $this->isEnabled()) {
            return 0;
        }

        $amount = (float) $eligibleAmount;

        if ($amount <= 0) {
            return 0;
        }

        $units = (int) floor($amount / $this->sarPerPoint());

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

        $original = (float) $originalEligibleAmount;
        $refunded = (float) $refundedAmount;

        if ($original <= 0 || $refunded <= 0) {
            return 0;
        }

        if ($refunded >= $original) {
            return $earnedPoints;
        }

        return (int) floor($earnedPoints * ($refunded / $original));
    }
}
