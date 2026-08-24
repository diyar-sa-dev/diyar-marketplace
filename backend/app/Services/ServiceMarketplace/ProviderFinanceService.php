<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\PayoutStatus;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderPayout;
use App\Models\ServiceBooking;
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
     * @return array<string, mixed>
     */
    public function summary(ProviderAccount $provider): array
    {
        $rate = $this->commissionRate();
        $currency = $this->currency();
        $monthStart = now()->startOfMonth();

        $monthlyGross = $this->formatAmount(
            $this->completedPaidBookingsQuery($provider)
                ->where('completed_at', '>=', $monthStart)
                ->sum('price'),
        );

        $monthlyCommission = $this->applyRate($monthlyGross, $rate);
        $monthlyNet = bcsub($monthlyGross, $monthlyCommission, 2);

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

        $availableBalance = bcsub($totalNet, $reserved, 2);
        if (bccomp($availableBalance, '0.00', 2) < 0) {
            $availableBalance = '0.00';
        }

        return [
            'currency' => $currency,
            'available_balance' => (float) $availableBalance,
            'monthly_gross_earnings' => (float) $monthlyGross,
            'monthly_commission' => (float) $monthlyCommission,
            'monthly_net_earnings' => (float) $monthlyNet,
            'commission_rate' => (float) $rate,
            'commission_percent' => (int) round((float) $rate * 100),
            'payout_minimum' => (float) config('diyar.finance.payout_minimum', '100.00'),
            'payout_schedule' => config('diyar.finance.payout_schedule', [
                'min_days' => 1,
                'max_days' => 3,
            ]),
        ];
    }

    /**
     * @return list<array{date: string, net: float}>
     */
    public function analytics(ProviderAccount $provider): array
    {
        $rate = $this->commissionRate();
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $bookings = $this->completedPaidBookingsQuery($provider)
            ->whereBetween('completed_at', [$monthStart, $monthEnd])
            ->get(['price', 'completed_at']);

        $totalsByDay = [];
        foreach ($bookings as $booking) {
            $day = (int) $booking->completed_at?->format('j');
            $gross = $this->formatAmount($booking->price);
            $net = bcsub($gross, $this->applyRate($gross, $rate), 2);
            $totalsByDay[$day] = bcadd((string) ($totalsByDay[$day] ?? '0.00'), $net, 2);
        }

        $bucketDays = [1, 5, 10, 15, 20, 25, (int) now()->endOfMonth()->format('j')];
        $points = [];
        $month = (int) now()->format('n');

        foreach ($bucketDays as $day) {
            $net = '0.00';
            foreach ($totalsByDay as $bookingDay => $amount) {
                if ($bookingDay <= $day) {
                    $net = bcadd($net, $amount, 2);
                }
            }

            $date = sprintf('%04d-%02d-%02d', (int) now()->format('Y'), $month, $day);

            $points[] = [
                'date' => $date,
                'net' => (float) $net,
            ];
        }

        return $points;
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
