<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Models\AffiliateProfile;
use App\Services\Finance\CommissionResolver;
use DateTimeInterface;

final class AffiliateBalanceService
{
    public function __construct(
        private readonly CommissionResolver $commissionResolver,
    ) {}

    /**
     * @return array{
     *     currency: string,
     *     pending: string,
     *     available: string,
     *     total: string,
     *     paid_out: string,
     *     payout_minimum: string,
     *     platform_commission: string,
     *     platform_commission_rate_percent: string,
     *     platform_commission_active: bool
     * }
     */
    public function summary(AffiliateProfile $profile, ?string $currency = null): array
    {
        $currency = $currency ?? (string) config('diyar.affiliate.currency', 'SAR');
        $rate = $this->platformRatePercent();

        $pendingGross = $this->sumForStatus($profile, $currency, [
            AffiliateCommissionStatus::Pending,
            AffiliateCommissionStatus::Approved,
        ]);

        $availableGross = $this->sumForStatus($profile, $currency, [
            AffiliateCommissionStatus::Available,
        ]);

        $paidOutGross = $this->sumForStatus($profile, $currency, [
            AffiliateCommissionStatus::Paid,
        ]);

        $pending = $this->netAmount($pendingGross);
        $available = $this->netAmount($availableGross);
        $paidOut = $this->netAmount($paidOutGross);

        $totalGross = bcadd(bcadd($pendingGross, $availableGross, 2), $paidOutGross, 2);
        $total = bcadd(bcadd($pending, $available, 2), $paidOut, 2);

        return [
            'currency' => $currency,
            'pending' => $pending,
            'available' => $available,
            'total' => $total,
            'paid_out' => $paidOut,
            'payout_minimum' => number_format((float) config('diyar.affiliate.payout_minimum', '100.00'), 2, '.', ''),
            'platform_commission' => $this->platformCut($totalGross),
            'platform_commission_rate_percent' => $rate,
            'platform_commission_active' => $this->isPlatformCommissionActive(),
        ];
    }

    public function availableBalance(AffiliateProfile $profile, ?string $currency = null): string
    {
        return $this->summary($profile, $currency)['available'];
    }

    /**
     * @return array{
     *     currency: string,
     *     gross: string,
     *     net: string,
     *     platform_commission: string,
     *     platform_commission_rate_percent: string,
     *     platform_commission_active: bool
     * }
     */
    public function periodMetrics(
        AffiliateProfile $profile,
        DateTimeInterface $from,
        DateTimeInterface $to,
        ?string $currency = null,
    ): array {
        $currency = $currency ?? (string) config('diyar.affiliate.currency', 'SAR');
        $gross = $this->sumForWindow($profile, $currency, $from, $to);

        return [
            'currency' => $currency,
            'gross' => $gross,
            'net' => $this->netAmount($gross),
            'platform_commission' => $this->platformCut($gross),
            'platform_commission_rate_percent' => $this->platformRatePercent(),
            'platform_commission_active' => $this->isPlatformCommissionActive(),
        ];
    }

    public function platformRatePercent(): string
    {
        return $this->commissionResolver->activeGlobalRatePercent();
    }

    public function isPlatformCommissionActive(): bool
    {
        return bccomp($this->platformRatePercent(), '0.00', 2) > 0;
    }

    public function platformCut(string $gross): string
    {
        $rate = $this->platformRatePercent();

        if (bccomp($gross, '0.00', 2) <= 0 || bccomp($rate, '0.00', 2) <= 0) {
            return '0.00';
        }

        return bcmul($gross, bcdiv($rate, '100', 6), 2);
    }

    public function netAmount(string $gross): string
    {
        return bcsub($gross, $this->platformCut($gross), 2);
    }

    /**
     * @param  list<AffiliateCommissionStatus>  $statuses
     */
    private function sumForStatus(AffiliateProfile $profile, string $currency, array $statuses): string
    {
        $sum = $profile->commissions()
            ->where('currency', $currency)
            ->whereIn('status', array_map(fn (AffiliateCommissionStatus $status) => $status->value, $statuses))
            ->sum('commission_amount');

        return number_format((float) $sum, 2, '.', '');
    }

    private function sumForWindow(
        AffiliateProfile $profile,
        string $currency,
        DateTimeInterface $from,
        DateTimeInterface $to,
    ): string {
        $sum = $profile->commissions()
            ->where('currency', $currency)
            ->whereNotIn('status', [
                AffiliateCommissionStatus::Reversed->value,
                AffiliateCommissionStatus::Cancelled->value,
            ])
            ->whereBetween('created_at', [$from, $to])
            ->sum('commission_amount');

        return number_format((float) $sum, 2, '.', '');
    }
}
