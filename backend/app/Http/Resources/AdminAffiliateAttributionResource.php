<?php

namespace App\Http\Resources;

use App\Models\AffiliateAttribution;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliateAttribution */
class AdminAffiliateAttributionResource extends JsonResource
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
            'affiliate_click_id' => $this->affiliate_click_id,
            'product_id' => $this->product_id,
            'user_id' => $this->user_id,
            'traffic_source' => $this->traffic_source,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'profile' => $this->whenLoaded('profile', fn () => [
                'id' => $this->profile?->id,
                'display_name' => $this->profile?->display_name,
            ]),
            'link' => $this->whenLoaded('link', fn () => [
                'id' => $this->link?->id,
                'referral_code' => $this->link?->referral_code,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
            ]),
        ];
    }
}
