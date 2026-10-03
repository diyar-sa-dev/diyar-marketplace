<?php

namespace App\Domains\Vendors\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Vendors\Requests\AdjustInventoryRequest;
use App\Domains\Catalog\Resources\ProductDetailResource;
use App\Domains\Catalog\Services\InventoryService;
use App\Domains\Catalog\Services\ProductService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class VendorInventoryController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
        private readonly InventoryService $inventory,
    ) {}

    public function adjust(AdjustInventoryRequest $request, string $product): JsonResponse
    {
        $model = $this->products->findOwnedProduct($request->user(), $product);
        $this->authorize('update', $model);

        try {
            $this->inventory->adjust(
                product: $model,
                actor: $request->user(),
                payload: $request->validated(),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $model->refresh()->load(['vendorAccount', 'category', 'colors', 'images.mediaFile', 'inventory']);

        return ApiResponse::success(data: [
            'product' => new ProductDetailResource($model),
        ]);
    }
}
