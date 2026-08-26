<?php

namespace App\Services\Analytics;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderReview;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Services\ServiceMarketplace\ProviderFinanceService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class ProviderAnalyticsService
{
    public function __construct(
        private readonly AnalyticsCache $cache,
        private readonly AnalyticsDateRangeResolver $ranges,
        private readonly ProviderFinanceService $finance,
    ) {}

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    public function overview(ProviderAccount $provider, array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.kpi_seconds', 60);

        return $this->cache->remember(
            'provider',
            $provider->id,
            'overview',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset']],
            $ttl,
            fn () => $this->buildOverview($provider, $range),
        );
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    public function bookingsSeries(ProviderAccount $provider, array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.chart_seconds', 180);

        return $this->cache->remember(
            'provider',
            $provider->id,
            'bookings_series',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset'], 'granularity' => $range['granularity']],
            $ttl,
            fn () => $this->buildBookingsSeries($provider, $range),
        );
    }

    public function services(
        ProviderAccount $provider,
        CarbonImmutable $from,
        CarbonImmutable $to,
        int $page = 1,
        int $perPage = 20,
    ): LengthAwarePaginator {
        $perPage = min(max($perPage, 1), 50);
        $currency = $this->finance->currency();

        $paginator = ServiceBooking::query()
            ->selectRaw('service_id')
            ->selectRaw('MAX(service_title_snapshot) as service_title')
            ->selectRaw('COUNT(*) as bookings_count')
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as completed_count", ServiceBookingStatus::Completed->value))
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as cancelled_count", ServiceBookingStatus::Cancelled->value))
            ->selectRaw(sprintf(
                "SUM(CASE WHEN status = '%s' AND payment_status = '%s' THEN price ELSE 0 END) as revenue",
                ServiceBookingStatus::Completed->value,
                ServiceBookingPaymentStatus::Paid->value,
            ))
            ->where('provider_account_id', $provider->id)
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('service_id')
            ->orderByDesc('revenue')
            ->paginate($perPage, ['*'], 'page', $page);

        $serviceIds = collect($paginator->items())->pluck('service_id')->filter()->all();
        $reviewStatsByService = [];

        if ($serviceIds !== []) {
            $reviewStatsByService = ProviderReview::query()
                ->where('provider_account_id', $provider->id)
                ->whereIn('service_id', $serviceIds)
                ->groupBy('service_id')
                ->selectRaw('service_id, AVG(rating) as avg_rating, COUNT(*) as review_count')
                ->pluck(null, 'service_id')
                ->all();
        }

        return $paginator->through(function ($row) use ($currency, $reviewStatsByService) {
            $reviewStats = $reviewStatsByService[$row->service_id] ?? null;
            $bookings = (int) $row->bookings_count;
            $completed = (int) $row->completed_count;

            return [
                'service_id' => $row->service_id,
                'service_title' => $row->service_title,
                'bookings_count' => $bookings,
                'completed_bookings' => $completed,
                'cancelled_bookings' => (int) $row->cancelled_count,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
                'average_booking_value' => $completed > 0
                    ? number_format((float) $row->revenue / $completed, 2, '.', '')
                    : '0.00',
                'rating' => $reviewStats?->avg_rating !== null
                    ? round((float) $reviewStats->avg_rating, 1)
                    : null,
                'review_count' => (int) ($reviewStats->review_count ?? 0),
                'completion_rate' => $bookings > 0
                    ? round(($completed / $bookings) * 100, 1)
                    : 0.0,
                'currency' => $currency,
            ];
        });
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    private function buildOverview(ProviderAccount $provider, array $range): array
    {
        $from = $range['from'];
        $to = $range['to'];
        $currency = $this->finance->currency();

        $bookingStats = ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('COUNT(*) as total')
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as created_count", ServiceBookingStatus::PendingProviderConfirmation->value))
            ->selectRaw(sprintf("SUM(CASE WHEN status IN ('%s','%s') THEN 1 ELSE 0 END) as confirmed_count",
                ServiceBookingStatus::Confirmed->value,
                ServiceBookingStatus::InProgress->value,
            ))
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as completed_count", ServiceBookingStatus::Completed->value))
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as cancelled_count", ServiceBookingStatus::Cancelled->value))
            ->first();

        $revenue = ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->where('status', ServiceBookingStatus::Completed->value)
            ->where('payment_status', ServiceBookingPaymentStatus::Paid->value)
            ->whereBetween('completed_at', [$from, $to])
            ->sum('price');

        $completed = (int) ($bookingStats->completed_count ?? 0);
        $reviewStats = ProviderReview::query()
            ->where('provider_account_id', $provider->id)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as review_count')
            ->first();

        $activeServices = Service::query()
            ->where('provider_account_id', $provider->id)
            ->where('is_active', true)
            ->count();

        $previousRange = $this->ranges->previousPeriod($from, $to);
        $previousRevenue = ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->where('status', ServiceBookingStatus::Completed->value)
            ->where('payment_status', ServiceBookingPaymentStatus::Paid->value)
            ->whereBetween('completed_at', [$previousRange['from'], $previousRange['to']])
            ->sum('price');

        $revenueFormatted = number_format((float) $revenue, 2, '.', '');
        $previousRevenueFormatted = number_format((float) $previousRevenue, 2, '.', '');
        $change = null;
        if ((float) $previousRevenue > 0) {
            $change = round((((float) $revenue - (float) $previousRevenue) / (float) $previousRevenue) * 100, 1);
        } elseif ((float) $revenue > 0) {
            $change = 100.0;
        }

        return [
            'period' => [
                'preset' => $range['preset'],
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'timezone' => config('app.timezone'),
            ],
            'currency' => $currency,
            'kpis' => [
                'bookings_created' => (int) ($bookingStats->total ?? 0),
                'bookings_confirmed' => (int) ($bookingStats->confirmed_count ?? 0),
                'bookings_completed' => $completed,
                'bookings_cancelled' => (int) ($bookingStats->cancelled_count ?? 0),
                'revenue' => [
                    'value' => $revenueFormatted,
                    'previous_value' => $previousRevenueFormatted,
                    'change_percent' => $change,
                ],
                'average_booking_value' => $completed > 0
                    ? number_format((float) $revenue / $completed, 2, '.', '')
                    : '0.00',
                'rating' => $reviewStats?->avg_rating !== null
                    ? round((float) $reviewStats->avg_rating, 1)
                    : null,
                'review_count' => (int) ($reviewStats->review_count ?? 0),
                'active_services' => $activeServices,
            ],
        ];
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    private function buildBookingsSeries(ProviderAccount $provider, array $range): array
    {
        $rows = DB::table('service_bookings')
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COUNT(*) as created')
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as completed", ServiceBookingStatus::Completed->value))
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as cancelled", ServiceBookingStatus::Cancelled->value))
            ->where('provider_account_id', $provider->id)
            ->whereBetween('created_at', [$range['from'], $range['to']])
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $revenueByDay = DB::table('service_bookings')
            ->selectRaw('DATE(completed_at) as day')
            ->selectRaw('COALESCE(SUM(price), 0) as revenue')
            ->where('provider_account_id', $provider->id)
            ->where('status', ServiceBookingStatus::Completed->value)
            ->where('payment_status', ServiceBookingPaymentStatus::Paid->value)
            ->whereBetween('completed_at', [$range['from'], $range['to']])
            ->groupBy('day')
            ->pluck('revenue', 'day');

        return [
            'period' => [
                'preset' => $range['preset'],
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
            ],
            'currency' => $this->finance->currency(),
            'series' => $rows->map(fn ($row) => [
                'label' => $row->day,
                'bookings_created' => (int) $row->created,
                'bookings_completed' => (int) $row->completed,
                'bookings_cancelled' => (int) $row->cancelled,
                'revenue' => number_format((float) ($revenueByDay[$row->day] ?? 0), 2, '.', ''),
            ])->all(),
        ];
    }
}
