<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminInventoryMovementResource;
use App\Http\Resources\ProductCardResource;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminInventoryController extends Controller
{
    public function products(Request $request): JsonResponse
    {
        $query = Product::query()->with(['vendorAccount', 'category']);

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereHas('inventory', function ($inventory): void {
                $inventory->whereColumn('quantity', '<=', 'low_stock_threshold');
            });
        }

        $paginator = $query->orderBy('name')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('products', ProductCardResource::collection($paginator->items()), $paginator);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::query()->with(['product', 'creator']);

        if ($productId = $request->string('product_id')->toString()) {
            $query->where('product_id', $productId);
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('inventory_movements', AdminInventoryMovementResource::collection($paginator->items()), $paginator);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
