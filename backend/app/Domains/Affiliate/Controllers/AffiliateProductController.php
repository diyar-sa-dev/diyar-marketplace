<?php

namespace App\Domains\Affiliate\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Affiliate\Resources\ProductAffiliateSettingResource;
use App\Domains\Affiliate\Services\AffiliateDashboardService;
use App\Domains\Affiliate\Services\AffiliateProfileService;
use App\Http\Controllers\Controller;
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
