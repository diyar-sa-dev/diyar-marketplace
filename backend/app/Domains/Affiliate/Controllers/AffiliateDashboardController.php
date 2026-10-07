<?php

namespace App\Domains\Affiliate\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Affiliate\Resources\AffiliateProfileResource;
use App\Domains\Affiliate\Services\AffiliateDashboardService;
use App\Domains\Affiliate\Services\AffiliateProfileService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateDashboardController extends Controller
{
    public function __construct(
        private readonly AffiliateProfileService $profiles,
        private readonly AffiliateDashboardService $dashboard,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());
        $this->profiles->assertDashboardAccess($profile);
        [$from, $to] = $this->dateRange($request);

        return ApiResponse::success(data: [
            'profile' => new AffiliateProfileResource($profile),
            'overview' => $this->dashboard->overview($profile, $from, $to),
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function dateRange(Request $request): array
    {
        $from = $request->query('from');
        $to = $request->query('to');

        if (is_string($from) && is_string($to)) {
            return [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()];
        }

        return AffiliateDashboardService::currentMonthRange();
    }
}
