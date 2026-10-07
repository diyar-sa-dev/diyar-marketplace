<?php

namespace App\Domains\Admin\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Admin\Resources\AdminPlatformFinancePeriodReportResource;
use App\Domains\Finance\Services\PlatformFinanceExportService;
use App\Domains\Finance\Services\PlatformFinanceReportingService;
use App\Enums\FinancePeriod;
use App\Http\Controllers\Controller;
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
