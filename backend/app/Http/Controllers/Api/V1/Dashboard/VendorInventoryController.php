<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\AdjustInventoryRequest;
use App\Http\Resources\ProductDetailResource;
use App\Services\Catalog\InventoryService;
use App\Services\Catalog\ProductService;
use App\Support\Api\ApiResponse;
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
