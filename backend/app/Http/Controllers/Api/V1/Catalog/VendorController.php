<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\VendorCardResource;
use App\Http\Resources\VendorPublicResource;
use App\Services\Catalog\ProductService;
use App\Services\Catalog\VendorService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class VendorController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
        private readonly VendorService $vendors,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->vendors->listPublic($request->query());

        return ApiResponse::success(data: [
            'items' => VendorCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $vendor = $this->vendors->findActiveBySlug($slug);

        return ApiResponse::success(data: [
            'vendor' => new VendorPublicResource($vendor),
        ]);
    }

    public function products(Request $request, string $slug): JsonResponse
    {
        $vendor = $this->vendors->findActiveBySlug($slug);
        $paginator = $this->products->listForVendorPublic($vendor, $request->query());

        return ApiResponse::success(data: $this->paginatedProducts($paginator));
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedProducts(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ProductCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
