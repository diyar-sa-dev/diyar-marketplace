<?php

namespace App\Http\Resources;

use App\Models\ProductAffiliateSetting;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductAffiliateSetting */
class ProductAffiliateSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $firstImage = $this->relationLoaded('product') ? $this->product?->images?->first() : null;
        $salePrice = (float) ($this->product?->sale_price ?? 0);
        $rate = (float) $this->commission_rate_percent;

        return [
            'product_id' => $this->product_id,
            'enabled' => $this->enabled,
            'commission_min_percent' => number_format((float) $this->commission_min_percent, 2, '.', ''),
            'commission_max_percent' => number_format((float) $this->commission_max_percent, 2, '.', ''),
            'commission_rate_percent' => number_format($rate, 2, '.', ''),
            'expected_commission' => number_format($salePrice * ($rate / 100), 2, '.', ''),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'slug' => $this->product?->slug,
                'sale_price' => $this->product?->sale_price,
                'image_url' => $firstImage?->relationLoaded('mediaFile') && $firstImage->mediaFile !== null
                    ? $media->url($firstImage->mediaFile->path)
                    : null,
                'vendor' => $this->product?->vendorAccount ? [
                    'business_name' => $this->product->vendorAccount->business_name,
                    'slug' => $this->product->vendorAccount->slug,
                ] : null,
            ]),
        ];
    }
}
