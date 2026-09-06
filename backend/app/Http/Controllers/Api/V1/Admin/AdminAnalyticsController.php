<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminPermissionService;
use App\Services\Analytics\AdminAnalyticsService;
use App\Services\Analytics\AnalyticsDateRangeResolver;
use App\Support\Api\ApiResponse;
use App\Support\Export\CsvExportHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAnalyticsController extends Controller
{
    public function __construct(
        private readonly AdminAnalyticsService $analytics,
        private readonly AnalyticsDateRangeResolver $ranges,
        private readonly AdminPermissionService $permissions,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $includeFinancial = $this->permissions->has($user, 'analytics.view_financial')
            || $this->permissions->has($user, 'balances.view');
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->overview($range, $includeFinancial),
        ]);
    }

    public function sales(Request $request): JsonResponse
    {
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->sales($range),
        ]);
    }

    public function funnel(Request $request): JsonResponse
    {
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->funnel($range),
        ]);
    }

    public function cohorts(Request $request): JsonResponse
    {
        $months = min(max((int) $request->query('months', 6), 3), 12);

        return ApiResponse::success([
            'analytics' => $this->analytics->cohorts($months),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->search($range),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $range = $this->ranges->resolveFromRequest($request);
        $rows = $this->analytics->exportRows($range['from'], $range['to']);
        $filename = sprintf('platform-analytics-%s.csv', now()->format('Ymd_His'));

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, [
                'order_id',
                'order_number',
                'payment_id',
                'date',
                'gross',
                'discount',
                'tax',
                'shipping',
                'payment_amount',
                'payment_method',
                'payment_status',
                'currency',
                'paid_at',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    CsvExportHelper::sanitizeCell($row->order_id),
                    CsvExportHelper::sanitizeCell($row->order_number),
                    CsvExportHelper::sanitizeCell($row->payment_id),
                    CsvExportHelper::sanitizeCell($row->created_at),
                    CsvExportHelper::sanitizeCell($row->gross),
                    CsvExportHelper::sanitizeCell($row->discount),
                    CsvExportHelper::sanitizeCell($row->tax),
                    CsvExportHelper::sanitizeCell($row->shipping),
                    CsvExportHelper::sanitizeCell($row->payment_amount),
                    CsvExportHelper::sanitizeCell($row->payment_method),
                    CsvExportHelper::sanitizeCell($row->payment_status),
                    CsvExportHelper::sanitizeCell($row->currency),
                    CsvExportHelper::sanitizeCell($row->paid_at),
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
