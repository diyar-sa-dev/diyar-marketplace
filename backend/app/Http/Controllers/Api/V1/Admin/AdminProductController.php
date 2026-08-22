<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Models\Product;
use App\Services\Admin\AdminProductService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function __construct(
        private readonly AdminProductService $products,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['vendorAccount', 'category']);

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $paginator = $query->orderByDesc('updated_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return ApiResponse::success(data: [
            'products' => ProductCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['vendorAccount', 'category', 'media']);

        return ApiResponse::success(data: [
            'product' => new ProductCardResource($product),
        ]);
    }

    public function activate(Request $request, Product $product): JsonResponse
    {
        $updated = $this->products->activate(
            product: $product,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: [
            'product' => new ProductCardResource($updated),
        ]);
    }

    public function deactivate(Request $request, Product $product): JsonResponse
    {
        $updated = $this->products->deactivate(
            product: $product,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: [
            'product' => new ProductCardResource($updated),
        ]);
    }
}
