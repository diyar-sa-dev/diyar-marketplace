<?php

namespace App\Services\Affiliate;

use InvalidArgumentException;

final class AffiliateCommissionRules
{
    public function platformMinPercent(): float
    {
        return (float) config('diyar.affiliate.platform_min_commission_percent', 1);
    }

    public function platformMaxPercent(): float
    {
        return (float) config('diyar.affiliate.platform_max_commission_percent', 30);
    }

    /**
     * @throws InvalidArgumentException
     */
    public function assertVendorRange(float $minPercent, float $maxPercent): void
    {
        $platformMin = $this->platformMinPercent();
        $platformMax = $this->platformMaxPercent();

        if ($minPercent < $platformMin || $maxPercent > $platformMax) {
            throw new InvalidArgumentException(__('diyar.affiliate.commission_outside_platform_limits', [
                'min' => $platformMin,
                'max' => $platformMax,
            ]));
        }

        if ($minPercent > $maxPercent) {
            throw new InvalidArgumentException(__('diyar.affiliate.commission_min_exceeds_max'));
        }
    }

    /**
     * @throws InvalidArgumentException
     */
    public function assertRateWithinRange(float $rate, float $minPercent, float $maxPercent): void
    {
        $this->assertVendorRange($minPercent, $maxPercent);

        if ($rate < $minPercent || $rate > $maxPercent) {
            throw new InvalidArgumentException(__('diyar.affiliate.commission_rate_out_of_range', [
                'min' => $minPercent,
                'max' => $maxPercent,
            ]));
        }
    }

    public function defaultRateForProduct(float $minPercent, float $maxPercent): float
    {
        $this->assertVendorRange($minPercent, $maxPercent);

        return $maxPercent;
    }
}
