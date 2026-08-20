<?php

namespace App\Http\Controllers\Api\V1\Dashboard\Affiliate;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductAffiliateSettingResource;
use App\Services\Affiliate\AffiliateDashboardService;
use App\Services\Affiliate\AffiliateProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateProductController extends Controller
{
    public function __construct(
        private readonly AffiliateProfileService $profiles,
        private readonly AffiliateDashboardService $dashboard,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->profiles->assertDashboardAccess(
            $this->profiles->resolveOrCreateForUser($request->user()),
        );

        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $page = max((int) $request->query('page', 1), 1);
        $search = is_string($request->query('search')) ? $request->query('search') : null;

        $paginator = $this->dashboard->promotableProducts($request->user(), $perPage, $page, $search);

        return ApiResponse::success(data: [
            'products' => ProductAffiliateSettingResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
