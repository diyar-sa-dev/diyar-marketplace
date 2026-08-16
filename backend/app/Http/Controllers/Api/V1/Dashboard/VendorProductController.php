<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreProductRequest;
use App\Http\Requests\Dashboard\UpdateProductRequest;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductDetailResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Catalog\ProductService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;

class VendorProductController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $paginator = $this->products->listForVendor($request->user(), $request->query());

        return ApiResponse::success(data: $this->paginatedProducts($paginator));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        try {
            $product = $this->products->create(
                user: $request->user(),
                attributes: $request->validated(),
                images: $request->file('images'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['product' => new ProductDetailResource($product)],
            message: __('diyar.catalog.product_created'),
            status: 201,
        );
    }

    public function show(Request $request, string $product): JsonResponse
    {
        $model = $this->products->findOwnedProduct($request->user(), $product);
        $this->authorize('view', $model);
        $model->load(['vendorAccount', 'category', 'colors', 'images.mediaFile', 'inventory']);

        return ApiResponse::success(data: [
            'product' => new ProductDetailResource($model),
        ]);
    }

    public function update(UpdateProductRequest $request, string $product): JsonResponse
    {
        $model = $this->products->findOwnedProduct($request->user(), $product);
        $this->authorize('update', $model);

        $updated = $this->products->update(
            user: $request->user(),
            product: $model,
            attributes: $request->validated(),
        );

        return ApiResponse::success(
            data: ['product' => new ProductDetailResource($updated)],
            message: __('diyar.catalog.product_updated'),
        );
    }

    public function destroy(Request $request, string $product): JsonResponse
    {
        $model = $this->products->findOwnedProduct($request->user(), $product);
        $this->authorize('delete', $model);

        $this->products->archive($request->user(), $model);

        return ApiResponse::success(message: __('diyar.catalog.product_archived'));
    }

    public function addImages(Request $request, string $product): JsonResponse
    {
        $model = $this->products->findOwnedProduct($request->user(), $product);
        $this->authorize('update', $model);

        $maxKb = (int) config('diyar_media.max_upload_kb', 5120);
        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:5'],
            'images.*' => ['file', 'max:'.$maxKb, 'mimes:jpg,jpeg,png,webp'],
        ]);

        try {
            $updated = $this->products->addImages(
                user: $request->user(),
                product: $model,
                files: $validated['images'],
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load(['vendorAccount', 'category', 'colors', 'images.mediaFile', 'inventory']);

        return ApiResponse::success(data: [
            'product' => new ProductDetailResource($updated),
        ]);
    }

    public function deleteImage(Request $request, string $product, string $image): JsonResponse
    {
        $model = $this->products->findOwnedProduct($request->user(), $product);
        $this->authorize('update', $model);

        $productImage = ProductImage::query()->whereKey($image)->firstOrFail();
        $this->products->deleteImage($request->user(), $model, $productImage);

        return ApiResponse::success();
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
