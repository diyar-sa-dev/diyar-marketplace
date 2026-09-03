<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Enums\FinancePeriod;
use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\RequestProviderPayoutRequest;
use App\Http\Resources\ProviderPayoutResource;
use App\Services\ServiceMarketplace\ProviderAccountResolver;
use App\Services\ServiceMarketplace\ProviderFinanceService;
use App\Services\ServiceMarketplace\ProviderFinanceTransactionService;
use App\Services\ServiceMarketplace\ProviderPayoutService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProviderFinanceController extends Controller
{
    public function __construct(
        private readonly ProviderFinanceService $finance,
        private readonly ProviderFinanceTransactionService $transactions,
        private readonly ProviderPayoutService $payouts,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $period = FinancePeriod::tryFromRequest($request->query('period'));

        return ApiResponse::success([
            'summary' => $this->finance->summary($provider, $period),
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $period = FinancePeriod::tryFromRequest($request->query('period'));
        [$from, $to] = $this->finance->window($period);

        return ApiResponse::success([
            'period' => [
                'type' => $period->value,
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
                'granularity' => $period->analyticsGranularity(),
            ],
            'analytics' => $this->finance->analytics($provider, $period),
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $type = $request->query('type');
        $period = FinancePeriod::tryFromRequest($request->query('period'));
        [$from, $to] = $this->finance->window($period);

        $paginator = $this->transactions->paginate(
            $provider,
            $page,
            $perPage,
            is_string($type) ? $type : null,
            $from,
            $to,
        );

        return ApiResponse::success([
            'transactions' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function exportReport(Request $request): StreamedResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());
        $period = FinancePeriod::tryFromRequest($request->query('period'));
        $summary = $this->finance->summary($provider, $period);
        $analytics = $this->finance->analytics($provider, $period);
        $filename = sprintf('provider-finance-%s-%s.csv', $period->value, now()->format('Ymd_His'));

        return response()->streamDownload(function () use ($summary, $analytics) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, [__('diyar.finance.export.metric'), __('diyar.finance.export.value')]);
            fputcsv($handle, [__('diyar.finance.export.available_balance'), $summary['available_balance']]);
            fputcsv($handle, [__('diyar.finance.export.monthly_gross'), $summary['monthly_gross_earnings']]);
            fputcsv($handle, [__('diyar.finance.export.monthly_commission'), $summary['monthly_commission']]);
            fputcsv($handle, [__('diyar.finance.export.monthly_net'), $summary['monthly_net_earnings']]);
            fputcsv($handle, []);
            fputcsv($handle, [__('diyar.finance.export.day'), __('diyar.finance.export.net_earnings')]);
            foreach ($analytics as $point) {
                fputcsv($handle, [$point['label'] ?? $point['date'] ?? '', $point['net']]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function requestPayout(RequestProviderPayoutRequest $request): JsonResponse
    {
        $provider = ProviderAccountResolver::forUser($request->user());

        try {
            $payout = $this->payouts->request(
                $provider,
                number_format((float) $request->validated('amount'), 2, '.', ''),
                $this->finance->currency(),
                $request->validated('bank_account_id'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['payout' => new ProviderPayoutResource($payout)],
            message: __('diyar.finance.payout_requested'),
            status: 201,
        );
    }
}
