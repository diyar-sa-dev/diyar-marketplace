<?php

namespace App\Http\Resources;

use App\Models\ServiceBookingPayment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceBookingPayment */
class ServiceBookingPaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'gateway' => $this->gateway,
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'failed_at' => $this->failed_at?->toIso8601String(),
            'failure_reason' => $this->failure_reason,
        ];
    }
}
