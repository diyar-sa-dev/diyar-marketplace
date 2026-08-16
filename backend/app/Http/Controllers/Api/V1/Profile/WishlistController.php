<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Services\Catalog\ProductEngagementService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function __construct(
        private readonly ProductEngagementService $engagement,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->engagement->paginateWishlist(
            $request->user(),
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 12),
        );

        $products = $paginator->getCollection()
            ->map(fn ($item) => $item->product)
            ->filter();

        return ApiResponse::success(data: [
            'items' => ProductCardResource::collection($products)->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $removed = $this->engagement->clearWishlist($request->user());

        return ApiResponse::success(
            data: ['removed' => $removed],
            message: __('diyar.catalog.wishlist_cleared'),
        );
    }
}
