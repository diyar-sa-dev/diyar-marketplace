<?php

namespace App\Http\Resources;

use App\Models\Product;
use App\Services\Catalog\ProductEngagementService;
use App\Services\Loyalty\LoyaltyRuleService;
use App\Services\Media\MediaUploadService;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $engagement = app(ProductEngagementService::class);
        $loyaltyRules = app(LoyaltyRuleService::class);
        $vendorOwnership = app(VendorOwnership::class);
        $viewer = $request->user();
        $firstImage = $this->relationLoaded('images') ? $this->images->first() : null;
        $comparePrice = $this->compare_price !== null ? (float) $this->compare_price : null;
        $salePrice = (float) $this->sale_price;
        $discountPercent = $comparePrice !== null && $comparePrice > $salePrice
            ? (int) round((($comparePrice - $salePrice) / $comparePrice) * 100)
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sale_price' => $this->sale_price,
            'compare_price' => $this->compare_price,
            'promotion_ends_at' => $this->promotion_ends_at?->toIso8601String(),
            'discount_percent' => $discountPercent,
            'availability_mode' => $this->availability_mode->value,
            'product_type' => $this->product_type->value,
            'created_at' => $this->created_at?->toIso8601String(),
            'image_url' => $firstImage?->relationLoaded('mediaFile')
                ? $media->url($firstImage->mediaFile->path)
                : null,
            'vendor' => $this->when($this->relationLoaded('vendorAccount') && $this->vendorAccount !== null, fn () => [
                'id' => $this->vendorAccount->id,
                'store_name' => $this->vendorAccount->business_name,
                'slug' => $this->vendorAccount->slug,
            ]),
            'is_own_store' => $viewer !== null
                && $this->relationLoaded('vendorAccount')
                && $this->vendorAccount !== null
                && $vendorOwnership->userOwnsVendorAccount($viewer, $this->vendorAccount->id),
            'category' => $this->when($this->relationLoaded('category') && $this->category !== null, fn () => [
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                'type' => $this->category->type->value,
            ]),
            'inventory' => $this->when($this->relationLoaded('inventory') && $this->inventory !== null, fn () => [
                'stock_quantity' => $this->inventory->stock_quantity,
                'reserved_quantity' => $this->inventory->reserved_quantity,
                'available_quantity' => $this->inventory->available_quantity,
            ]),
            'rating_avg' => $engagement->ratingAverage($this->resource),
            'reviews_count' => $engagement->reviewsCount($this->resource),
            'loyalty_points_estimate' => $loyaltyRules->calculatePoints($salePrice),
            'user_saved' => $this->resolveUserSaved($request, $engagement),
        ];
    }

    private function resolveUserSaved(Request $request, ProductEngagementService $engagement): bool
    {
        if (array_key_exists('user_saved', $this->resource->getAttributes())) {
            return (bool) $this->user_saved;
        }

        return $engagement->userSaved($request->user(), $this->resource);
    }
}
