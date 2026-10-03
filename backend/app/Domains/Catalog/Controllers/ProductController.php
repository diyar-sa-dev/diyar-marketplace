<?php

namespace App\Domains\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Catalog\Requests\ProductListRequest;
use App\Domains\Analytics\Services\ProductViewAnalyticsService;
use App\Domains\Catalog\Services\CachedPublicProductDetailService;
use App\Domains\Catalog\Services\CachedPublicProductListService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly CachedPublicProductListService $publicList,
        private readonly CachedPublicProductDetailService $publicDetail,
        private readonly ProductViewAnalyticsService $productViewAnalytics,
    ) {}

    public function index(ProductListRequest $request): JsonResponse
    {
        return ApiResponse::success(data: $this->publicList->paginated(
            $request->validatedFilters(),
            $request->user(),
        ));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $detail = $this->publicDetail->show($id, $request->user());

        $this->productViewAnalytics->recordView(
            $request,
            $detail['analytics_product_id'],
            $detail['analytics_vendor_account_id'],
        );

        return ApiResponse::success(data: [
            'product' => $detail['product'],
        ]);
    }
}
