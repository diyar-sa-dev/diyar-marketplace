<?php

namespace App\Http\Resources;

use App\Models\Refund;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Refund */
class RefundResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'return_request_id' => $this->return_request_id,
            'status' => $this->status->value,
            'items_subtotal' => number_format((float) $this->items_subtotal, 2, '.', ''),
            'vat_amount' => number_format((float) $this->vat_amount, 2, '.', ''),
            'shipping_amount' => number_format((float) $this->shipping_amount, 2, '.', ''),
            'total_amount' => number_format((float) $this->total_amount, 2, '.', ''),
            'currency' => $this->currency,
            'processed_at' => $this->processed_at?->toIso8601String(),
        ];
    }
}
