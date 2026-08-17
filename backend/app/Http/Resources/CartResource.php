<?php

namespace App\Http\Resources;

use App\Models\Cart;
use App\Services\Cart\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Cart */
class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $cartService = app(CartService::class);

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'item_count' => $cartService->itemCount($this->resource),
            'items' => CartItemResource::collection($this->whenLoaded('items'))->resolve(),
            'totals' => [
                'subtotal' => $cartService->calculateSubtotal($this->resource),
                'discount' => null,
                'shipping' => null,
                'tax' => null,
                'total' => null,
            ],
        ];
    }
}
