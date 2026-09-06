<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\FinancePeriod;
use App\Enums\PayoutStatus;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderPayout;
use App\Models\ServiceBooking;
use App\Services\Analytics\AnalyticsTimeBuckets;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

final class ProviderFinanceService
{
    public function commissionRate(): string
    {
        return number_format((float) config('diyar.services.platform_commission_rate', '0.10'), 2, '.', '');
    }

    public function currency(): string
    {
        return (string) config('diyar.finance.currency', 'SAR');
    }

    /**
     * @return array{0: CarbonInterface, 1: CarbonInterface}
     */
    public function window(FinancePeriod $period, ?CarbonInterface $now = null): array
    {
        $now = $now ?? now();
        $end = $now->copy()->endOfDay();

        $from = match ($period) {
            FinancePeriod::Day => $now->copy()->startOfDay(),
            FinancePeriod::Week => $now->copy()->subDays(6)->startOfDay(),
            FinancePeriod::Month => $now->copy()->subDays(29)->startOfDay(),
            FinancePeriod::ThreeMonths => $now->copy()->subMonths(3)->startOfDay(),
            FinancePeriod::SixMonths => $now->copy()->subMonths(6)->startOfDay(),
            FinancePeriod::TwelveMonths => $now->copy()->subMonths(12)->startOfDay(),
            FinancePeriod::Year => $now->copy()->startOfYear(),
        };

        return [$from, $end];
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(ProviderAccount $provider, FinancePeriod $period = FinancePeriod::Month): array
    {
        $rate = $this->commissionRate();
        $currency = $this->currency();
        [$from, $to] = $this->window($period);

        $periodGross = $this->formatAmount(
            $this->completedPaidBookingsQuery($provider)
                ->tap(fn (Builder $query) => $this->constrainToWindow($query, $from, $to))
                ->sum('price'),
        );

        $periodCommission = $this->applyRate($periodGross, $rate);
        $periodNet = bcsub($periodGross, $periodCommission, 2);

        $totalGross = $this->formatAmount(
            $this->completedPaidBookingsQuery($provider)->sum('price'),
        );
        $totalNet = bcsub($totalGross, $this->applyRate($totalGross, $rate), 2);

        $reserved = $this->formatAmount(
            ProviderPayout::query()
                ->where('provider_account_id', $provider->id)
                ->whereIn('status', [
                    PayoutStatus::Pending->value,
                    PayoutStatus::Approved->value,
                    PayoutStatus::Processing->value,
                ])
                ->sum('amount'),
        );

        $paidOut = $this->formatAmount(
            ProviderPayout::query()
                ->where('provider_account_id', $provider->id)
                ->where('status', PayoutStatus::Paid->value)
                ->sum('amount'),
        );

        $availableBalance = bcsub(bcsub($totalNet, $reserved, 2), $paidOut, 2);
        if (bccomp($availableBalance, '0.00', 2) < 0) {
            $availableBalance = '0.00';
        }

        return [
            'currency' => $currency,
            'available_balance' => (float) $availableBalance,
            'monthly_gross_earnings' => (float) $periodGross,
            'monthly_commission' => (float) $periodCommission,
            'monthly_net_earnings' => (float) $periodNet,
            'commission_rate' => (float) $rate,
            'commission_percent' => (int) round((float) $rate * 100),
            'payout_minimum' => (float) config('diyar.finance.payout_minimum', '100.00'),
            'payout_schedule' => config('diyar.finance.payout_schedule', [
                'min_days' => 1,
                'max_days' => 3,
            ]),
            'period' => [
                'type' => $period->value,
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ];
    }

    /**
     * @return list<array{date: string, label: string, net: float}>
     */
    public function analytics(ProviderAccount $provider, FinancePeriod $period = FinancePeriod::Month): array
    {
        $rate = $this->commissionRate();
        [$from, $to] = $this->window($period);
        $fromImmutable = CarbonImmutable::parse($from);
        $toImmutable = CarbonImmutable::parse($to);

        $bookings = $this->completedPaidBookingsQuery($provider)
            ->tap(fn (Builder $query) => $this->constrainToWindow($query, $from, $to))
            ->get(['price', 'completed_at', 'updated_at']);

        $points = [];
        foreach (AnalyticsTimeBuckets::build($fromImmutable, $toImmutable, $period->analyticsGranularity()) as $bucket) {
            $net = '0.00';

            foreach ($bookings as $booking) {
                $occurredAt = $booking->completed_at ?? $booking->updated_at;
                if ($occurredAt === null || $occurredAt->lt($bucket['from']) || $occurredAt->gt($bucket['to'])) {
                    continue;
                }

                $gross = $this->formatAmount($booking->price);
                $bookingNet = bcsub($gross, $this->applyRate($gross, $rate), 2);
                $net = bcadd($net, $bookingNet, 2);
            }

            $points[] = [
                'date' => $bucket['from']->toDateString(),
                'label' => $bucket['label'],
                'net' => (float) $net,
            ];
        }

        return $points;
    }

    /**
     * @param  Builder<ServiceBooking>  $query
     * @return Builder<ServiceBooking>
     */
    private function constrainToWindow(Builder $query, CarbonInterface $from, CarbonInterface $to): Builder
    {
        return $query->where(function (Builder $inner) use ($from, $to) {
            $inner->whereBetween('completed_at', [$from, $to])
                ->orWhere(function (Builder $fallback) use ($from, $to) {
                    $fallback->whereNull('completed_at')
                        ->whereBetween('updated_at', [$from, $to]);
                });
        });
    }

    /**
     * @return Builder<ServiceBooking>
     */
    private function completedPaidBookingsQuery(ProviderAccount $provider): Builder
    {
        return ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->where('status', ServiceBookingStatus::Completed->value)
            ->where('payment_status', ServiceBookingPaymentStatus::Paid->value);
    }

    private function formatAmount(float|string|null $amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }

    private function applyRate(string $amount, string $rate): string
    {
        return bcmul($amount, $rate, 2);
    }
}
