<?php

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class AdminPaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'status' => $this->status->value,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'gateway' => $this->gateway,
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'gateway_payment_id' => $this->gateway_payment_id,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'failed_at' => $this->failed_at?->toIso8601String(),
            'failure_reason' => $this->failure_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order?->id,
                'order_number' => $this->order?->order_number,
                'status' => $this->order?->status?->value,
            ]),
        ];
    }
}
