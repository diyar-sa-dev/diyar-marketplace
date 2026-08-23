<?php

namespace App\Http\Resources;

use App\Models\VendorAccount;
use App\Services\Media\MediaUploadService;
use App\Services\StoreReview\StoreReviewService;
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
        $storeReviews = app(StoreReviewService::class);

        return [
            'id' => $this->id,
            'store_name' => $this->business_name,
            'slug' => $this->slug,
            'description' => $this->description,
            'location' => $this->location,
            'logo_url' => $media->url($this->logo_path),
            'cover_url' => $media->url($this->cover_path),
            'product_count' => array_key_exists('active_products_count', $this->resource->getAttributes())
                ? (int) $this->resource->active_products_count
                : null,
            'rating_avg' => $this->resolveRatingAverage($storeReviews),
            'reviews_count' => $this->resolveReviewsCount($storeReviews),
        ];
    }

    private function resolveRatingAverage(StoreReviewService $storeReviews): ?float
    {
        if (array_key_exists('store_reviews_avg_rating', $this->resource->getAttributes())) {
            $avg = $this->store_reviews_avg_rating;

            return $avg === null ? null : round((float) $avg, 1);
        }

        return $storeReviews->ratingAverage($this->resource);
    }

    private function resolveReviewsCount(StoreReviewService $storeReviews): int
    {
        if (array_key_exists('store_reviews_count', $this->resource->getAttributes())) {
            return (int) $this->store_reviews_count;
        }

        return $storeReviews->reviewsCount($this->resource);
    }
}
