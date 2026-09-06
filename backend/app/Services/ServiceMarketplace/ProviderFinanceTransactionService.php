<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\PayoutStatus;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderPayout;
use App\Models\ServiceBooking;
use DateTimeInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

final class ProviderFinanceTransactionService
{
    public function __construct(
        private readonly ProviderFinanceService $finance,
    ) {}

    /**
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginate(
        ProviderAccount $provider,
        int $page,
        int $perPage,
        ?string $type = null,
        ?DateTimeInterface $from = null,
        ?DateTimeInterface $to = null,
    ): LengthAwarePaginator {
        $items = $this->collect($provider, $type, $from, $to);
        $total = $items->count();
        $page = max($page, 1);
        $perPage = min(max($perPage, 1), 50);
        $offset = ($page - 1) * $perPage;

        return new \Illuminate\Pagination\LengthAwarePaginator(
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
        ProviderAccount $provider,
        ?string $type = null,
        ?DateTimeInterface $from = null,
        ?DateTimeInterface $to = null,
    ): Collection {
        $rate = $this->finance->commissionRate();
        $currency = $this->finance->currency();
        $rows = collect();

        $bookings = ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->where('status', ServiceBookingStatus::Completed)
            ->where('payment_status', ServiceBookingPaymentStatus::Paid)
            ->when($from && $to, function ($query) use ($from, $to) {
                $query->where(function ($inner) use ($from, $to) {
                    $inner->whereBetween('completed_at', [$from, $to])
                        ->orWhere(function ($fallback) use ($from, $to) {
                            $fallback->whereNull('completed_at')
                                ->whereBetween('created_at', [$from, $to]);
                        });
                });
            })
            ->orderByDesc('completed_at')
            ->get(['id', 'reference', 'price', 'currency', 'completed_at', 'created_at']);

        foreach ($bookings as $booking) {
            $gross = number_format((float) $booking->price, 2, '.', '');
            $commission = bcmul($gross, $rate, 2);
            $net = bcsub($gross, $commission, 2);
            $at = $booking->completed_at ?? $booking->created_at;
            $ref = $booking->reference;

            $rows->push([
                'id' => 'booking-gross-'.$booking->id,
                'transaction_type' => 'service_revenue',
                'amount' => $gross,
                'currency' => $booking->currency ?: $currency,
                'direction' => 'credit',
                'description' => __('diyar.finance.provider_booking_revenue', ['reference' => $ref]),
                'booking_reference' => $ref,
                'created_at' => $at?->toIso8601String(),
                'status' => 'completed',
            ]);

            $rows->push([
                'id' => 'booking-commission-'.$booking->id,
                'transaction_type' => 'platform_commission',
                'amount' => $commission,
                'currency' => $booking->currency ?: $currency,
                'direction' => 'debit',
                'description' => __('diyar.finance.provider_booking_commission', ['reference' => $ref]),
                'booking_reference' => $ref,
                'created_at' => $at?->toIso8601String(),
                'status' => 'completed',
            ]);
        }

        $payouts = ProviderPayout::query()
            ->where('provider_account_id', $provider->id)
            ->when($from && $to, fn ($query) => $query->whereBetween('requested_at', [$from, $to]))
            ->orderByDesc('requested_at')
            ->get();

        foreach ($payouts as $payout) {
            $status = match ($payout->status) {
                PayoutStatus::Pending, PayoutStatus::Approved, PayoutStatus::Processing => 'scheduled',
                PayoutStatus::Paid => 'completed',
                PayoutStatus::Rejected, PayoutStatus::Cancelled, PayoutStatus::Failed => 'cancelled',
            };

            $rows->push([
                'id' => 'payout-'.$payout->id,
                'transaction_type' => 'payout',
                'amount' => number_format((float) $payout->amount, 2, '.', ''),
                'currency' => $payout->currency,
                'direction' => 'debit',
                'description' => __('diyar.finance.provider_payout_request', ['reference' => $payout->reference]),
                'booking_reference' => null,
                'created_at' => ($payout->processed_at ?? $payout->requested_at)?->toIso8601String(),
                'status' => $status,
            ]);
        }

        if ($type !== null && $type !== '' && $type !== 'all') {
            $rows = $rows->filter(function (array $row) use ($type) {
                return match ($type) {
                    'revenue' => $row['transaction_type'] === 'service_revenue',
                    'commission' => $row['transaction_type'] === 'platform_commission',
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
