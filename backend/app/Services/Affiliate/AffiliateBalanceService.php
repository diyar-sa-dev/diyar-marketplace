<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Models\AffiliateProfile;

final class AffiliateBalanceService
{
    /**
     * @return array{
     *     currency: string,
     *     pending: string,
     *     available: string,
     *     total: string,
     *     paid_out: string
     * }
     */
    public function summary(AffiliateProfile $profile, ?string $currency = null): array
    {
        $currency = $currency ?? (string) config('diyar.affiliate.currency', 'SAR');

        $pending = $this->sumForStatus($profile, $currency, [
            AffiliateCommissionStatus::Pending,
            AffiliateCommissionStatus::Approved,
        ]);

        $available = $this->sumForStatus($profile, $currency, [
            AffiliateCommissionStatus::Available,
        ]);

        $paidOut = $this->sumForStatus($profile, $currency, [
            AffiliateCommissionStatus::Paid,
        ]);

        $total = bcadd($pending, $available, 2);
        $total = bcadd($total, $paidOut, 2);

        return [
            'currency' => $currency,
            'pending' => $pending,
            'available' => $available,
            'total' => $total,
            'paid_out' => $paidOut,
            'payout_minimum' => number_format((float) config('diyar.affiliate.payout_minimum', '100.00'), 2, '.', ''),
        ];
    }

    public function availableBalance(AffiliateProfile $profile, ?string $currency = null): string
    {
        return $this->summary($profile, $currency)['available'];
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
}
