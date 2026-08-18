<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Enums\FinancePeriod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\RequestVendorPayoutRequest;
use App\Http\Resources\FinancialTransactionResource;
use App\Http\Resources\VendorFinanceAnalyticsPointResource;
use App\Http\Resources\VendorFinancePeriodReportResource;
use App\Http\Resources\VendorFinanceSummaryResource;
use App\Http\Resources\VendorPayoutResource;
use App\Models\FinancialTransaction;
use App\Models\VendorPayout;
use App\Services\Finance\PayoutService;
use App\Services\Finance\VendorBalanceService;
use App\Services\Finance\VendorFinanceExportService;
use App\Services\Finance\VendorFinancePeriodResolver;
use App\Services\Finance\VendorFinanceReportingService;
use App\Services\Finance\VendorTransactionQueryFilter;
use App\Services\Vendor\VendorAccessService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorFinanceController extends Controller
{
    public function __construct(
        private readonly VendorBalanceService $balances,
        private readonly VendorFinanceReportingService $reporting,
        private readonly VendorFinanceExportService $export,
        private readonly VendorTransactionQueryFilter $transactionFilters,
        private readonly PayoutService $payouts,
        private readonly VendorAccessService $access,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'finance');

        $period = FinancePeriod::tryFromRequest($request->query('period'));
        $report = $this->reporting->periodReport($vendorAccount, $period);

        return ApiResponse::success([
            'report' => new VendorFinancePeriodReportResource($report),
            'summary' => new VendorFinanceSummaryResource($this->balances->summary($vendorAccount)),
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'finance');

        $period = FinancePeriod::tryFromRequest($request->query('period'));
        $points = $this->reporting->analytics($vendorAccount, $period);
        $window = app(VendorFinancePeriodResolver::class)->resolve($period);

        return ApiResponse::success([
            'period' => [
                'type' => $period->value,
                'from' => $window['from']->toIso8601String(),
                'to' => $window['to']->toIso8601String(),
            ],
            'analytics' => VendorFinanceAnalyticsPointResource::collection($points),
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'finance');

        $query = FinancialTransaction::query()->with('order:id,order_number')->latest();
        $this->transactionFilters->applyVendorScope($query, $vendorAccount);
        $this->transactionFilters->applyTypeFilter($query, $request->query('type'));

        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $transactions = $query->paginate($perPage);

        return ApiResponse::success([
            'transactions' => FinancialTransactionResource::collection(collect($transactions->items())),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    public function exportReport(Request $request): StreamedResponse|JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'finance');

        $period = FinancePeriod::tryFromRequest($request->query('period'));
        $typeFilter = $request->query('type');
        $report = $this->reporting->periodReport($vendorAccount, $period);
        $transactions = $this->reporting->transactionsForExport($vendorAccount, $period, is_string($typeFilter) ? $typeFilter : null);

        $filename = sprintf('vendor-finance-%s-%s.csv', $period->value, now()->format('Ymd_His'));

        return response()->streamDownload(
            fn () => $this->export->stream($report, $transactions),
            $filename,
            ['Content-Type' => 'text/csv; charset=UTF-8'],
        );
    }

    public function payouts(Request $request): JsonResponse
    {
        $this->authorize('viewAny', VendorPayout::class);

        $vendorAccount = $this->access->assertPermission($request->user(), 'finance');

        $payouts = VendorPayout::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->latest('requested_at')
            ->paginate(15);

        return ApiResponse::success([
            'payouts' => VendorPayoutResource::collection(collect($payouts->items())),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ],
        ]);
    }

    public function requestPayout(RequestVendorPayoutRequest $request): JsonResponse
    {
        $this->authorize('create', VendorPayout::class);

        $vendorAccount = $this->access->assertPermission($request->user(), 'finance_withdraw');

        try {
            $payout = $this->payouts->request(
                $vendorAccount,
                number_format((float) $request->validated('amount'), 2, '.', ''),
                (string) config('diyar.finance.currency', 'SAR'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['payout' => new VendorPayoutResource($payout)],
            message: __('diyar.finance.payout_requested'),
            status: 201,
        );
    }

    public function cancelPayout(Request $request, VendorPayout $payout): JsonResponse
    {
        $this->authorize('cancel', $payout);

        try {
            $updated = $this->payouts->cancel($payout);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new VendorPayoutResource($updated)]);
    }
}
