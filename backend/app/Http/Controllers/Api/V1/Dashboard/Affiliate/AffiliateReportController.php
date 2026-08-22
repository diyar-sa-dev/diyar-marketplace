<?php

namespace App\Http\Controllers\Api\V1\Dashboard\Affiliate;

use App\Http\Controllers\Controller;
use App\Services\Affiliate\AffiliateDashboardService;
use App\Services\Affiliate\AffiliateProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateReportController extends Controller
{
    public function __construct(
        private readonly AffiliateProfileService $profiles,
        private readonly AffiliateDashboardService $dashboard,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());
        $this->profiles->assertDashboardAccess($profile);

        $period = is_string($request->query('period')) ? $request->query('period') : 'month';
        $fromInput = is_string($request->query('from')) ? $request->query('from') : null;
        $toInput = is_string($request->query('to')) ? $request->query('to') : null;
        [$from, $to] = AffiliateDashboardService::resolvePeriodRange($period, $fromInput, $toInput);

        $sort = is_string($request->query('sort')) ? $request->query('sort') : 'earnings';

        return ApiResponse::success(data: [
            'summary' => $this->dashboard->reportSummary($profile, $from, $to),
            'by_link' => $this->dashboard->reportByLink($profile, $from, $to, $sort),
            'by_source' => $this->dashboard->reportBySource($profile, $from, $to),
            'daily' => $this->dashboard->dailySeries($profile, $from, $to),
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'key' => $period,
            ],
        ]);
    }
}
