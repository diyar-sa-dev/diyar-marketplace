<?php

namespace App\Http\Resources;

use App\Enums\OrderStatus;
use App\Enums\VendorOrderStatus;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'effective_status' => $this->resolveEffectiveStatus(),
            'shipping_address' => [
                'id' => $this->shipping_address_id,
                'recipient_name' => $this->shipping_recipient_name,
                'phone' => $this->shipping_phone,
                'city' => $this->shipping_city,
                'district' => $this->shipping_district,
                'street' => $this->shipping_street,
                'building' => $this->shipping_building,
                'apartment' => $this->shipping_apartment,
            ],
            'subtotal' => number_format((float) $this->subtotal, 2, '.', ''),
            'shipping_total' => number_format((float) $this->shipping_total, 2, '.', ''),
            'assembly_total' => number_format((float) $this->assembly_total, 2, '.', ''),
            'discount_total' => number_format((float) $this->discount_total, 2, '.', ''),
            'vat_amount' => number_format((float) $this->vat_amount, 2, '.', ''),
            'grand_total' => number_format((float) $this->grand_total, 2, '.', ''),
            'vendor_orders' => VendorOrderResource::collection($this->whenLoaded('vendorOrders')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function resolveEffectiveStatus(): string
    {
        if ($this->status === OrderStatus::Cancelled) {
            return OrderStatus::Cancelled->value;
        }

        if ($this->relationLoaded('vendorOrders')
            && $this->vendorOrders->isNotEmpty()
            && $this->vendorOrders->every(
                fn ($vendorOrder) => $vendorOrder->status === VendorOrderStatus::Cancelled,
            )) {
            return OrderStatus::Cancelled->value;
        }

        return $this->status->value;
    }
}
