<?php

namespace App\Http\Resources;

use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Shipment */
class AdminShipmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vendor_order_id' => $this->vendor_order_id,
            'status' => $this->status->value,
            'tracking_number' => $this->tracking_number,
            'carrier' => $this->carrier,
            'shipped_at' => $this->shipped_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'vendor_order' => $this->whenLoaded('vendorOrder', fn () => [
                'id' => $this->vendorOrder?->id,
                'order_number' => $this->vendorOrder?->order_number,
                'vendor_account_id' => $this->vendorOrder?->vendor_account_id,
            ]),
        ];
    }
}
