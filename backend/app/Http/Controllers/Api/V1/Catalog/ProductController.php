<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductDetailResource;
use App\Services\Catalog\ProductService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->products->listPublic($request->query());

        return ApiResponse::success(data: $this->paginatedProducts($paginator));
    }

    public function show(string $id): JsonResponse
    {
        $product = $this->products->findPublic($id);
        $related = $this->products->relatedProducts($product);

        return ApiResponse::success(data: [
            'product' => new ProductDetailResource($product, $related),
        ]);
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
