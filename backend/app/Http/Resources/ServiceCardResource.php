<?php

namespace App\Http\Resources;

use App\Models\Service;
use App\Support\ServiceMarketplace\ServiceMarketplacePresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Service */
class ServiceCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $presenter = app(ServiceMarketplacePresenter::class);
        $locale = app()->getLocale();
        $categoryName = $this->relationLoaded('category') && $this->category !== null
            ? ($locale === 'ar' ? $this->category->name_ar : $this->category->name_en)
            : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image_url' => $presenter->mediaUrl($this->cover_path),
            'pricing_mode' => $this->pricing_mode->value,
            'starting_price' => $this->starting_price !== null ? (float) $this->starting_price : null,
            'currency' => $this->currency,
            'pricing_label' => $presenter->pricingLabel(
                $this->pricing_mode,
                $this->starting_price !== null ? (float) $this->starting_price : null,
                $this->currency,
            ),
            'delivery_type_label' => $this->delivery_type_label,
            'rating_average' => (float) $this->rating_average,
            'reviews_count' => $this->reviews_count,
            'remote_available' => $this->remote_available,
            'location' => $this->location,
            'category' => $this->when($categoryName !== null, fn () => [
                'id' => $this->category->id,
                'slug' => $this->category->slug,
                'name' => $categoryName,
            ]),
            'provider' => $this->when(
                $this->relationLoaded('providerAccount') && $this->providerAccount !== null,
                fn () => [
                    'id' => $this->providerAccount->id,
                    'display_name' => $this->providerAccount->business_name,
                    'slug' => $this->providerAccount->slug,
                    'avatar_url' => $presenter->mediaUrl($this->providerAccount->avatar_path),
                    'verified' => $this->providerAccount->verified,
                ],
            ),
        ];
    }
}
