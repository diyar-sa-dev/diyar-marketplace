<?php

namespace App\Http\Resources;

use App\Models\AffiliateCommission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliateCommission */
class AdminAffiliateCommissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'affiliate_profile_id' => $this->affiliate_profile_id,
            'affiliate_link_id' => $this->affiliate_link_id,
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'status' => $this->status->value,
            'commission_rate_percent' => $this->commission_rate_percent,
            'commission_base_amount' => number_format((float) $this->commission_base_amount, 2, '.', ''),
            'commission_amount' => number_format((float) $this->commission_amount, 2, '.', ''),
            'currency' => $this->currency,
            'available_at' => $this->available_at?->toIso8601String(),
            'reversed_at' => $this->reversed_at?->toIso8601String(),
            'affiliate_payout_id' => $this->affiliate_payout_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'profile' => $this->whenLoaded('profile', fn () => [
                'id' => $this->profile?->id,
                'display_name' => $this->profile?->display_name,
            ]),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order?->id,
                'order_number' => $this->order?->order_number,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
            ]),
        ];
    }
}
