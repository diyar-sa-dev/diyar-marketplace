<?php

namespace App\Http\Resources;

use App\Enums\AddressType;
use App\Models\VendorOrder;
use App\Services\Payments\PaymentMethodLabelResolver;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorOrder */
class VendorOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $paymentLabelResolver = app(PaymentMethodLabelResolver::class);

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_number' => $this->whenLoaded('order', fn () => $this->order->order_number),
            'vendor_account_id' => $this->vendor_account_id,
            'vendor_name' => $this->whenLoaded('vendorAccount', fn () => $this->vendorAccount->business_name),
            'status' => $this->status->value,
            'subtotal' => number_format((float) $this->subtotal, 2, '.', ''),
            'shipping_method' => $this->shipping_method,
            'shipping_cost' => number_format((float) $this->shipping_cost, 2, '.', ''),
            'pickup_location_label' => $this->pickup_location_label,
            'free_shipping_applied' => (bool) $this->free_shipping_applied,
            'assembly_cost' => number_format((float) $this->assembly_cost, 2, '.', ''),
            'discount_amount' => number_format((float) $this->discount_amount, 2, '.', ''),
            'vat_amount' => number_format((float) $this->vat_amount, 2, '.', ''),
            'vendor_total' => number_format((float) $this->vendor_total, 2, '.', ''),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'shipment' => new ShipmentResource($this->whenLoaded('shipment')),
            'customer_name' => $this->whenLoaded('order', fn () => $this->order->shipping_recipient_name),
            'customer_phone' => $this->whenLoaded('order', fn () => $this->order->shipping_phone),
            'customer_email' => $this->whenLoaded('order', function () {
                if ($this->order->customer_email !== null) {
                    return $this->order->customer_email;
                }

                return $this->order->relationLoaded('user')
                    ? $this->order->user?->email
                    : null;
            }),
            'customer_member_since' => $this->whenLoaded('order', function () {
                if (! $this->order->relationLoaded('user') || $this->order->user === null) {
                    return null;
                }

                return $this->order->user->created_at?->toIso8601String();
            }),
            'shipping_address' => $this->whenLoaded('order', fn () => $this->resolveShippingAddress()),
            'payment_status' => $this->when(
                $this->relationLoaded('order') && $this->order?->relationLoaded('payment'),
                fn () => $this->order->payment?->status->value,
            ),
            'payment_method' => $this->when(
                $this->relationLoaded('order') && $this->order?->relationLoaded('payment'),
                fn () => $this->order->payment?->payment_method,
            ),
            'payment_method_label' => $this->when(
                $this->relationLoaded('order') && $this->order?->relationLoaded('payment'),
                fn () => $paymentLabelResolver->resolve($this->order->payment),
            ),
            'payment_reference' => $this->when(
                $this->relationLoaded('order') && $this->order?->relationLoaded('payment'),
                fn () => $this->order->payment?->payment_reference,
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveShippingAddress(): ?array
    {
        $order = $this->order;
        $linkedAddress = $order->relationLoaded('shippingAddress') ? $order->shippingAddress : null;

        $label = $linkedAddress?->label;
        if ($label === 'Manual Order') {
            $label = null;
        }

        $type = $linkedAddress?->type instanceof AddressType
            ? $linkedAddress->type->value
            : ($linkedAddress?->type ?? null);

        return [
            'label' => $label,
            'type' => $type,
            'recipient_name' => $order->shipping_recipient_name,
            'phone' => $order->shipping_phone,
            'city' => $order->shipping_city,
            'district' => $order->shipping_district,
            'street' => $order->shipping_street,
            'building' => $order->shipping_building,
            'apartment' => $order->shipping_apartment,
        ];
    }
}
