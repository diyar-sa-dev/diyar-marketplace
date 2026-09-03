<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\AffiliatePayoutStatus;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use DateTimeInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection;

final class AffiliateFinanceTransactionService
{
    public function __construct(
        private readonly AffiliateBalanceService $balances,
    ) {}

    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(
        AffiliateProfile $profile,
        int $page,
        int $perPage,
        ?string $type = null,
        ?DateTimeInterface $from = null,
        ?DateTimeInterface $to = null,
    ): LengthAwarePaginator
    {
        $items = $this->collect($profile, $type, $from, $to);
        $total = $items->count();
        $page = max($page, 1);
        $perPage = min(max($perPage, 1), 50);
        $offset = ($page - 1) * $perPage;

        return new Paginator(
            $items->slice($offset, $perPage)->values(),
            $total,
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()],
        );
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function collect(
        AffiliateProfile $profile,
        ?string $type = null,
        ?DateTimeInterface $from = null,
        ?DateTimeInterface $to = null,
    ): Collection
    {
        $rows = collect();

        $commissions = AffiliateCommission::query()
            ->with('order:id,order_number')
            ->where('affiliate_profile_id', $profile->id)
            ->when($from && $to, fn ($query) => $query->whereBetween('created_at', [$from, $to]))
            ->orderByDesc('created_at')
            ->get();

        $rateActive = $this->balances->isPlatformCommissionActive();

        foreach ($commissions as $commission) {
            $reference = $commission->order?->order_number;
            $reversed = $commission->status === AffiliateCommissionStatus::Reversed
                || $commission->status === AffiliateCommissionStatus::Cancelled;
            $gross = number_format((float) $commission->commission_amount, 2, '.', '');
            $cut = $this->balances->platformCut($gross);
            $status = match ($commission->status) {
                AffiliateCommissionStatus::Pending, AffiliateCommissionStatus::Approved => 'scheduled',
                AffiliateCommissionStatus::Available, AffiliateCommissionStatus::Paid => 'completed',
                AffiliateCommissionStatus::Reversed, AffiliateCommissionStatus::Cancelled => 'cancelled',
            };

            $rows->push([
                'id' => 'commission-'.$commission->id,
                'transaction_type' => $reversed ? 'affiliate_commission_reversal' : 'affiliate_commission',
                'amount' => $gross,
                'currency' => $commission->currency,
                'direction' => $reversed ? 'debit' : 'credit',
                'description' => $reversed
                    ? __('diyar.finance.affiliate_commission_reversal')
                    : __('diyar.finance.affiliate_marketer_commission', [
                        'reference' => $reference ?? $commission->id,
                    ]),
                'order_number' => $reference,
                'created_at' => ($commission->available_at ?? $commission->created_at)?->toIso8601String(),
                'status' => $status,
            ]);

            if ($rateActive && ! $reversed && bccomp($cut, '0.00', 2) > 0) {
                $rows->push([
                    'id' => 'commission-fee-'.$commission->id,
                    'transaction_type' => 'platform_commission',
                    'amount' => $cut,
                    'currency' => $commission->currency,
                    'direction' => 'debit',
                    'description' => __('diyar.finance.affiliate_platform_commission', [
                        'reference' => $reference ?? $commission->id,
                        'percent' => $this->balances->platformRatePercent(),
                    ]),
                    'order_number' => $reference,
                    'created_at' => ($commission->available_at ?? $commission->created_at)?->toIso8601String(),
                    'status' => $status,
                ]);
            }
        }

        $payouts = AffiliatePayout::query()
            ->where('affiliate_profile_id', $profile->id)
            ->when($from && $to, fn ($query) => $query->whereBetween('requested_at', [$from, $to]))
            ->orderByDesc('requested_at')
            ->get();

        foreach ($payouts as $payout) {
            $rows->push([
                'id' => 'payout-'.$payout->id,
                'transaction_type' => 'payout',
                'amount' => number_format((float) $payout->amount, 2, '.', ''),
                'currency' => $payout->currency,
                'direction' => 'debit',
                'description' => __('diyar.finance.affiliate_payout_request', [
                    'reference' => $payout->reference,
                ]),
                'order_number' => null,
                'created_at' => ($payout->processed_at ?? $payout->requested_at)?->toIso8601String(),
                'status' => match ($payout->status) {
                    AffiliatePayoutStatus::Pending,
                    AffiliatePayoutStatus::Approved,
                    AffiliatePayoutStatus::Processing => 'scheduled',
                    AffiliatePayoutStatus::Paid => 'completed',
                    AffiliatePayoutStatus::Rejected,
                    AffiliatePayoutStatus::Cancelled => 'cancelled',
                },
            ]);
        }

        if ($type !== null && $type !== '' && $type !== 'all') {
            $rows = $rows->filter(function (array $row) use ($type) {
                return match ($type) {
                    'commission' => in_array($row['transaction_type'], ['affiliate_commission', 'affiliate_commission_reversal', 'platform_commission'], true),
                    'payout' => $row['transaction_type'] === 'payout',
                    default => true,
                };
            });
        }

        return $rows
            ->sortByDesc(fn (array $row) => $row['created_at'] ?? '')
            ->values();
    }
}
