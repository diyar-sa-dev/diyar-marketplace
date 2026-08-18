<?php

namespace App\Http\Resources;

use App\Models\Service;
use App\Support\ServiceMarketplace\ServiceMarketplacePresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Service */
class ServiceDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $presenter = app(ServiceMarketplacePresenter::class);
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'pricing_mode' => $this->pricing_mode->value,
            'starting_price' => $this->starting_price !== null ? (float) $this->starting_price : null,
            'currency' => $this->currency,
            'pricing_label' => $presenter->pricingLabel(
                $this->pricing_mode,
                $this->starting_price !== null ? (float) $this->starting_price : null,
                $this->currency,
            ),
            'delivery_type_label' => $this->delivery_type_label,
            'location' => $this->location,
            'remote_available' => $this->remote_available,
            'features' => $this->features ?? [],
            'image_url' => $presenter->mediaUrl($this->cover_path),
            'rating_average' => (float) $this->rating_average,
            'reviews_count' => $this->reviews_count,
            'requests_count' => $this->requests_count,
            'category' => $this->when($this->relationLoaded('category') && $this->category !== null, fn () => [
                'id' => $this->category->id,
                'slug' => $this->category->slug,
                'name' => $locale === 'ar' ? $this->category->name_ar : $this->category->name_en,
            ]),
            'provider' => $this->when(
                $this->relationLoaded('providerAccount') && $this->providerAccount !== null,
                fn () => new ProviderPublicResource($this->providerAccount),
            ),
            'portfolio' => ServicePortfolioItemResource::collection(
                $this->whenLoaded('portfolioItems'),
            ),
        ];
    }
}
