<?php

namespace App\Http\Resources;

use App\Models\VendorAccount;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorAccount */
class VendorCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'store_name' => $this->business_name,
            'slug' => $this->slug,
            'description' => $this->description,
            'location' => $this->location,
            'logo_url' => $media->url($this->logo_path),
            'cover_url' => $media->url($this->cover_path),
            'product_count' => $this->when(
                isset($this->active_products_count),
                fn () => (int) $this->active_products_count,
            ),
        ];
    }
}
