<?php

namespace App\Http\Resources;

use App\Models\VendorCoupon;
use App\Services\Coupon\VendorCouponValidationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorCoupon */
class VendorCouponResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $validation = app(VendorCouponValidationService::class);

        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type->value,
            'scope_type' => $this->scope_type?->value ?? 'all',
            'stackable' => (bool) $this->stackable,
            'exclusive_group' => $this->exclusive_group,
            'value' => $this->value,
            'fixed_amount' => $this->fixed_amount !== null ? (string) $this->fixed_amount : null,
            'minimum_order' => (string) $this->minimum_order,
            'maximum_discount' => $this->maximum_discount !== null ? (string) $this->maximum_discount : null,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'usage_limit' => $this->usage_limit,
            'usage_limit_per_user' => $this->usage_limit_per_user,
            'used_count' => $this->used_count,
            'is_active' => $this->is_active,
            'effective_status' => $validation->effectiveStatus($this->resource),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
