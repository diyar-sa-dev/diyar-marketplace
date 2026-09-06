<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Enums\FinancePeriod;
use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsDateRangeResolver;
use App\Services\Analytics\VendorAnalyticsService;
use App\Services\Finance\VendorFinanceExportService;
use App\Services\Finance\VendorFinanceReportingService;
use App\Services\Vendor\VendorAccessService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorAnalyticsController extends Controller
{
    public function __construct(
        private readonly VendorAnalyticsService $analytics,
        private readonly AnalyticsDateRangeResolver $ranges,
        private readonly VendorAccessService $access,
        private readonly VendorFinanceReportingService $financeReporting,
        private readonly VendorFinanceExportService $export,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'dashboard');
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->overview($vendorAccount, $range),
        ]);
    }

    public function sales(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'dashboard');
        $range = $this->ranges->resolveFromRequest($request);

        return ApiResponse::success([
            'analytics' => $this->analytics->salesSeries($vendorAccount, $range),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'dashboard');
        $range = $this->ranges->resolveFromRequest($request);
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $sort = (string) $request->query('sort', 'revenue');

        $paginator = $this->analytics->products(
            $vendorAccount,
            $range['from'],
            $range['to'],
            $sort,
            $page,
            $perPage,
        );

        return ApiResponse::success([
            'period' => [
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
            ],
            'products' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'finance');
        $period = FinancePeriod::tryFromRequest($request->query('period'));
        $typeFilter = $request->query('type');
        $report = $this->financeReporting->periodReport($vendorAccount, $period);
        $transactions = $this->financeReporting->transactionsForExport(
            $vendorAccount,
            $period,
            is_string($typeFilter) ? $typeFilter : null,
        );

        $filename = sprintf('vendor-analytics-%s-%s.csv', $period->value, now()->format('Ymd_His'));

        return response()->streamDownload(
            fn () => $this->export->stream($report, $transactions),
            $filename,
            ['Content-Type' => 'text/csv; charset=UTF-8'],
        );
    }
}
