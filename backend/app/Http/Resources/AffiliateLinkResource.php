<?php

namespace App\Http\Resources;

use App\Models\AffiliateLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliateLink */
class AffiliateLinkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $grossConversions = (int) ($this->gross_conversions ?? $this->conversion_count ?? 0);
        $reversedConversions = (int) ($this->reversed_conversions ?? 0);
        $netConversions = max(0, $grossConversions - $reversedConversions);

        $reversedCommission = number_format((float) ($this->reversed_commission_amount ?? 0), 2, '.', '');
        $netCommission = number_format((float) ($this->net_commission_amount ?? $this->total_earnings ?? 0), 2, '.', '');
        $grossCommission = number_format((float) bcadd($netCommission, $reversedCommission, 2), 2, '.', '');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'referral_code' => $this->referral_code,
            'commission_rate_percent' => number_format((float) $this->commission_rate_percent, 2, '.', ''),
            'is_active' => $this->is_active,
            'campaign_name' => $this->campaign_name,
            'source' => $this->source,
            'click_count' => $this->click_count,
            'gross_conversions' => $grossConversions,
            'reversed_conversions' => $reversedConversions,
            'net_conversions' => $netConversions,
            'gross_commission' => $grossCommission,
            'reversed_commission' => $reversedCommission,
            'net_commission' => $netCommission,
            'conversion_count' => $netConversions,
            'total_earnings' => $netCommission,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'slug' => $this->product?->slug,
                'sale_price' => $this->product?->sale_price,
            ]),
            'public_url' => $this->when(
                isset($this->public_url),
                fn () => $this->public_url,
            ),
        ];
    }
}
