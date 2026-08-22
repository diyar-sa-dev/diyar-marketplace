<?php

namespace App\Http\Resources;

use App\Models\AffiliateClick;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliateClick */
class AdminAffiliateClickResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'affiliate_link_id' => $this->affiliate_link_id,
            'affiliate_profile_id' => $this->affiliate_profile_id,
            'product_id' => $this->product_id,
            'traffic_source' => $this->traffic_source,
            'referrer_url' => $this->referrer_url,
            'converted_at' => $this->converted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'link' => $this->whenLoaded('link', fn () => [
                'id' => $this->link?->id,
                'referral_code' => $this->link?->referral_code,
                'name' => $this->link?->name,
            ]),
            'profile' => $this->whenLoaded('profile', fn () => [
                'id' => $this->profile?->id,
                'display_name' => $this->profile?->display_name,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
            ]),
        ];
    }
}
