<?php

namespace App\Http\Resources;

use App\Models\VendorAccount;
use App\Services\Media\MediaUploadService;
use App\Services\StoreReview\StoreReviewService;
use App\Services\Vendor\VendorStoreFollowService;
use App\Services\Vendor\VendorStorefrontPresenter;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorAccount */
class VendorPublicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $storeReviews = app(StoreReviewService::class);
        $presenter = app(VendorStorefrontPresenter::class);
        $follows = app(VendorStoreFollowService::class);

        $followSummary = $follows->summary($this->resource, $request->user());
        $viewer = $request->user();
        $isOwnStore = $viewer !== null && app(VendorOwnership::class)->userOwnsVendorAccount($viewer, $this->id);

        return [
            'id' => $this->id,
            'store_name' => $this->business_name,
            'slug' => $this->slug,
            'description' => $this->description,
            'location' => $this->location,
            'support_phone' => $this->support_phone,
            'support_email' => $this->support_email,
            'website_url' => $this->website_url,
            'logo_url' => $media->url($this->logo_path),
            'cover_url' => $media->url($this->cover_path),
            'rating_avg' => $storeReviews->ratingAverage($this->resource),
            'reviews_count' => $storeReviews->reviewsCount($this->resource),
            'products_count' => $this->when(
                isset($this->active_products_count),
                fn () => (int) $this->active_products_count,
                fn () => $presenter->productsCount($this->resource),
            ),
            'followers_count' => $followSummary['followers_count'],
            'is_following' => $followSummary['is_following'],
            'is_own_store' => $isOwnStore,
            'working_hours' => $presenter->workingHours(
                $this->relationLoaded('workingHours') ? $this->workingHours : $this->workingHours()->get(),
            ),
            'return_policy_summary' => $presenter->returnPolicySummary(
                $this->relationLoaded('returnPolicy') ? $this->returnPolicy : $this->returnPolicy()->first(),
            ),
            'shipping_summary' => $presenter->shippingSummary(
                $this->relationLoaded('shippingSettings') ? $this->shippingSettings : $this->shippingSettings()->first(),
            ),
        ];
    }
}
