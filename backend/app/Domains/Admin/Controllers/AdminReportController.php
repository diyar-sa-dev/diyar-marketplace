<?php

namespace App\Domains\Admin\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Analytics\Services\AdminAnalyticsService;
use App\Domains\Analytics\Services\AnalyticsDateRangeResolver;
use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function __construct(
        private readonly AdminAnalyticsService $analytics,
        private readonly AnalyticsDateRangeResolver $ranges,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $range = $this->ranges->resolveFromRequest($request);
        $from = $range['from'];
        $to = $range['to'];

        if ($request->filled('from') || $request->filled('to')) {
            return ApiResponse::success(data: $this->analytics->legacySummary($from, $to));
        }

        $legacyFrom = CarbonImmutable::now(config('app.timezone'))->subDays(30)->startOfDay();
        $legacyTo = CarbonImmutable::now(config('app.timezone'))->endOfDay();

        return ApiResponse::success(data: $this->analytics->legacySummary($legacyFrom, $legacyTo));
    }
}
