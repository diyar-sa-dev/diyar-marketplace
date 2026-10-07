<?php

namespace App\Domains\Catalog\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Catalog\Requests\ProductListRequest;
use App\Domains\Catalog\Resources\CategoryResource;
use App\Domains\Catalog\Resources\ProductCardResource;
use App\Domains\Catalog\Services\CategoryService;
use App\Domains\Catalog\Services\ProductService;
use App\Http\Controllers\Controller;
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
            'categories' => CategoryResource::collection($tree)->resolve(),
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

    public function items(ProductListRequest $request, string $slug): JsonResponse
    {
        $category = $this->categories->findActiveBySlug($slug);
        $paginator = $this->products->listForCategory($category, $request->validatedFilters(), $request->user());

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
