<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AdminAnalyticsService;
use App\Services\Analytics\AnalyticsDateRangeResolver;
use App\Support\Api\ApiResponse;
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
