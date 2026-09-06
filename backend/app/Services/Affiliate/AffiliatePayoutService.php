<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\AffiliatePayoutStatus;
use App\Events\Domain\AffiliatePayoutRequested;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class AffiliatePayoutService
{
    public function __construct(
        private readonly AffiliateBalanceService $balances,
    ) {}

    public function request(AffiliateProfile $profile, string $amount, ?string $idempotencyKey = null): AffiliatePayout
    {
        $amount = number_format((float) $amount, 2, '.', '');
        $minimum = number_format((float) config('diyar.affiliate.payout_minimum', '100.00'), 2, '.', '');
        $currency = (string) config('diyar.affiliate.currency', 'SAR');

        if (bccomp($amount, $minimum, 2) < 0) {
            throw new InvalidArgumentException(__('diyar.affiliate.payout_below_minimum', ['minimum' => $minimum]));
        }

        if ($profile->payout_iban === null || trim((string) $profile->payout_iban) === '') {
            throw new InvalidArgumentException(__('diyar.affiliate.payout_account_required'));
        }

        if ($idempotencyKey !== null) {
            $existing = AffiliatePayout::query()
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing !== null) {
                return $existing;
            }
        }

        return DB::transaction(function () use ($profile, $amount, $currency, $idempotencyKey) {
            AffiliateProfile::query()->whereKey($profile->id)->lockForUpdate()->first();

            $available = $this->balances->availableBalance($profile, $currency);

            if (bccomp($amount, $available, 2) > 0) {
                throw new InvalidArgumentException(__('diyar.affiliate.insufficient_balance'));
            }

            $hasPending = AffiliatePayout::query()
                ->where('affiliate_profile_id', $profile->id)
                ->whereIn('status', [
                    AffiliatePayoutStatus::Pending->value,
                    AffiliatePayoutStatus::Approved->value,
                    AffiliatePayoutStatus::Processing->value,
                ])
                ->exists();

            if ($hasPending) {
                throw new InvalidArgumentException(__('diyar.affiliate.pending_payout_exists'));
            }

            $payout = AffiliatePayout::query()->create([
                'reference' => $this->nextReference(),
                'affiliate_profile_id' => $profile->id,
                'amount' => $amount,
                'currency' => $currency,
                'status' => AffiliatePayoutStatus::Pending,
                'requested_at' => now(),
                'idempotency_key' => $idempotencyKey,
            ]);

            $reservedAmount = $this->reserveCommissions($profile, $payout, $amount, $currency);

            if (bccomp($reservedAmount, $amount, 2) !== 0) {
                $payout->update(['amount' => $reservedAmount]);
            }

            AffiliateDashboardService::bustDashboardCache($profile);

            DB::afterCommit(fn () => event(new AffiliatePayoutRequested($payout->fresh(['profile.user']))));

            return $payout->fresh();
        });
    }

    private function reserveCommissions(AffiliateProfile $profile, AffiliatePayout $payout, string $amount, string $currency): string
    {
        $commissions = AffiliateCommission::query()
            ->where('affiliate_profile_id', $profile->id)
            ->where('currency', $currency)
            ->where('status', AffiliateCommissionStatus::Available)
            ->orderBy('available_at')
            ->lockForUpdate()
            ->get();

        $reservedTotal = '0.00';

        foreach ($commissions as $commission) {
            if (bccomp($reservedTotal, $amount, 2) >= 0) {
                break;
            }

            $commissionAmount = $this->balances->netAmount(
                number_format((float) $commission->commission_amount, 2, '.', ''),
            );

            $commission->update([
                'status' => AffiliateCommissionStatus::Approved,
                'affiliate_payout_id' => $payout->id,
            ]);

            $reservedTotal = bcadd($reservedTotal, $commissionAmount, 2);
        }

        if (bccomp($reservedTotal, $amount, 2) < 0) {
            throw new InvalidArgumentException(__('diyar.affiliate.insufficient_balance'));
        }

        return $reservedTotal;
    }

    private function nextReference(): string
    {
        do {
            $reference = 'AP-'.now()->format('Ymd').'-'.strtoupper(Str::random(8));
        } while (AffiliatePayout::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
