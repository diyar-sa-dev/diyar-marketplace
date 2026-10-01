<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\ProductListRequest;
use App\Services\Analytics\ProductViewAnalyticsService;
use App\Services\Catalog\CachedPublicProductDetailService;
use App\Services\Catalog\CachedPublicProductListService;
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
