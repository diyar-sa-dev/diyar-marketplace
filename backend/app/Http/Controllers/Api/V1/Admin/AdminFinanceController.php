<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\FinancePeriod;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminPlatformFinancePeriodReportResource;
use App\Services\Finance\PlatformFinanceExportService;
use App\Services\Finance\PlatformFinanceReportingService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminFinanceController extends Controller
{
    public function __construct(
        private readonly PlatformFinanceReportingService $reporting,
        private readonly PlatformFinanceExportService $export,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $period = FinancePeriod::tryFromRequest($request->query('period'));

        return ApiResponse::success(data: [
            'report' => new AdminPlatformFinancePeriodReportResource(
                $this->reporting->periodReport($period),
            ),
        ]);
    }

    public function exportReport(Request $request): StreamedResponse
    {
        $period = FinancePeriod::tryFromRequest($request->query('period'));
        $report = $this->reporting->periodReport($period);
        $transactions = $this->reporting->transactionsForExport($period);
        $filename = sprintf('platform-finance-%s-%s.csv', $period->value, now()->format('Ymd_His'));

        return response()->streamDownload(
            fn () => $this->export->stream($report, $transactions),
            $filename,
            ['Content-Type' => 'text/csv; charset=UTF-8'],
        );
    }
}
