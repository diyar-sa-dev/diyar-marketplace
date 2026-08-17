<?php

namespace App\Http\Resources;

use App\Models\ReturnItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReturnItem */
class ReturnItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_item_id' => $this->order_item_id,
            'quantity' => $this->quantity,
            'unit_price' => number_format((float) $this->unit_price, 2, '.', ''),
            'line_subtotal' => number_format((float) $this->line_subtotal, 2, '.', ''),
            'product_name' => $this->whenLoaded('orderItem', fn () => $this->orderItem?->product_name),
        ];
    }
}
