<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductCardResource;
use App\Services\Catalog\CategoryService;
use App\Services\Catalog\ProductService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categories,
        private readonly ProductService $products,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tree = $this->categories->listActiveTree($request->query('type'));

        return ApiResponse::success(data: [
            'categories' => CategoryResource::collection($tree),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $category = $this->categories->findActiveBySlug($slug);
        $category->load(['children' => fn ($q) => $q->active()->ordered()]);

        return ApiResponse::success(data: [
            'category' => new CategoryResource($category),
        ]);
    }

    public function items(Request $request, string $slug): JsonResponse
    {
        $category = $this->categories->findActiveBySlug($slug);
        $paginator = $this->products->listForCategory($category, $request->query());

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
