<?php

namespace App\Http\Resources;

use App\Models\AffiliatePayout;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliatePayout */
class AffiliatePayoutResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'status' => $this->status->value,
            'requested_at' => $this->requested_at?->toIso8601String(),
            'processed_at' => $this->processed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'payment_reference' => $this->payment_reference,
        ];
    }
}
