<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsDateRangeResolver;
use App\Services\Analytics\ProviderAnalyticsService;
use App\Services\ServiceMarketplace\ProviderAccountResolver;
use App\Services\ServiceMarketplace\ProviderFinanceService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProviderAnalyticsController extends Controller
{
    public function __construct(
        private readonly ProviderAnalyticsService $analytics,
        private readonly AnalyticsDateRangeResolver $ranges,
        private readonly ProviderFinanceService $finance,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->overview($provider, $range),
        ]);
    }

    public function bookings(Request $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->bookingsSeries($provider, $range),
        ]);
    }

    public function services(Request $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $range = $this->ranges->resolveFromRequest($request);
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);

        $paginator = $this->analytics->services(
            $provider,
            $range['from'],
            $range['to'],
            $page,
            $perPage,
        );

        return ApiResponse::success([
            'period' => [
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
            ],
            'services' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $range = $this->ranges->resolveFromRequest($request);
        $overview = $this->analytics->overview($provider, $range);
        $bookings = $this->analytics->bookingsSeries($provider, $range);
        $filename = sprintf('provider-analytics-%s.csv', now()->format('Ymd_His'));

        return response()->streamDownload(function () use ($overview, $bookings) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, [__('diyar.finance.export.metric'), __('diyar.finance.export.value')]);
            foreach ($overview['kpis'] as $key => $value) {
                $label = __('diyar.finance.export.'.$key);
                if ($label === 'diyar.finance.export.'.$key) {
                    $label = $key;
                }
                if (is_array($value)) {
                    fputcsv($handle, [$label, $value['value'] ?? json_encode($value)]);
                } else {
                    fputcsv($handle, [$label, $value]);
                }
            }
            fputcsv($handle, []);
            fputcsv($handle, [
                __('diyar.finance.export.day'),
                __('diyar.finance.export.bookings_created'),
                __('diyar.finance.export.bookings_completed'),
                __('diyar.finance.export.bookings_cancelled'),
                __('diyar.finance.export.revenue'),
            ]);
            foreach ($bookings['series'] as $point) {
                fputcsv($handle, [
                    $point['label'],
                    $point['bookings_created'],
                    $point['bookings_completed'],
                    $point['bookings_cancelled'],
                    $point['revenue'],
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
