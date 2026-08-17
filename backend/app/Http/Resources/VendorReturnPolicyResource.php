<?php

namespace App\Http\Resources;

use App\Models\VendorReturnPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorReturnPolicy */
class VendorReturnPolicyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'returnable' => $this->returnable,
            'return_window_days' => $this->return_window_days,
            'accepted_reasons' => $this->accepted_reasons,
            'requires_unused' => $this->requires_unused,
            'requires_evidence' => $this->requires_evidence,
            'return_shipping_paid_by' => $this->return_shipping_paid_by->value,
            'shipping_refundable' => $this->shipping_refundable,
        ];
    }
}
