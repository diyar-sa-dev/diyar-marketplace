<?php

namespace App\Http\Resources;

use App\Models\ServiceCategory;
use App\Support\ServiceMarketplace\ServiceMarketplacePresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceCategory */
class ServiceCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $presenter = app(ServiceMarketplacePresenter::class);

        return [
            'id' => $this->id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon_key' => $this->icon_key,
            'image_url' => $presenter->mediaUrl($this->image_path),
            'sort_order' => $this->sort_order,
        ];
    }
}
