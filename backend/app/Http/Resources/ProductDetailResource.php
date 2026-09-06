<?php

namespace App\Http\Resources;

use App\Enums\AvailabilityMode;
use App\Models\Product;
use App\Services\Catalog\ProductEngagementService;
use App\Services\Catalog\ProductPreorderService;
use App\Services\Catalog\ProductSalesStatsService;
use App\Services\Media\MediaUploadService;
use App\Support\Vendor\VendorAccessResolver;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/** @mixin Product */
class ProductDetailResource extends JsonResource
{
    /**
     * @param  Collection<int, Product>|null  $relatedProducts
     */
    public function __construct($resource, protected ?Collection $relatedProducts = null)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $engagement = app(ProductEngagementService::class);
        $vendorOwnership = app(VendorOwnership::class);
        $viewer = $request->user();
        $isOwnStore = $viewer !== null
            && $this->relationLoaded('vendorAccount')
            && $this->vendorAccount !== null
            && $vendorOwnership->userOwnsVendorAccount($viewer, $this->vendorAccount->id);

        $viewerVendor = $viewer !== null ? VendorAccessResolver::vendorAccount($viewer) : null;
        $isVendorDashboardView = $viewerVendor !== null
            && $this->vendor_account_id === $viewerVendor->id;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'sale_price' => $this->sale_price,
            'compare_price' => $this->compare_price,
            'promotion_ends_at' => $this->promotion_ends_at?->toIso8601String(),
            'product_type' => $this->product_type->value,
            'availability_mode' => $this->availability_mode->value,
            'expected_available_at' => $this->expected_available_at?->toDateString(),
            'status' => $this->status->value,
            'dimensions' => [
                'width' => $this->width,
                'height' => $this->height,
                'depth' => $this->depth,
            ],
            'materials' => $this->normalizeMaterials($this->materials),
            'warranty' => $this->warranty,
            'return_policy' => [
                'override_enabled' => (bool) $this->return_policy_override_enabled,
                'returnable' => $this->returnable,
                'return_window_days' => $this->return_window_days,
                'return_accepted_reasons' => $this->return_accepted_reasons,
                'return_requires_unused' => $this->return_requires_unused,
                'return_requires_evidence' => $this->return_requires_evidence,
                'return_shipping_paid_by' => $this->return_shipping_paid_by,
                'return_shipping_refundable' => $this->return_shipping_refundable,
            ],
            'colors' => $this->when($this->relationLoaded('colors'), fn () => $this->colors->map(fn ($color) => [
                'name' => $color->name,
                'hex_code' => $color->hex_code,
            ])),
            'images' => $this->when($this->relationLoaded('images'), fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => $image->relationLoaded('mediaFile')
                    ? $media->url($image->mediaFile->path)
                    : null,
                'sort_order' => $image->sort_order,
            ])),
            'inventory' => $this->when($this->relationLoaded('inventory') && $this->inventory !== null, fn () => [
                'stock_quantity' => $this->inventory->stock_quantity,
                'reserved_quantity' => $this->inventory->reserved_quantity,
                'available_quantity' => $this->inventory->available_quantity,
            ]),
            'rating_avg' => $engagement->ratingAverage($this->resource),
            'reviews_count' => $engagement->reviewsCount($this->resource),
            'likes_count' => $engagement->likesCount($this->resource),
            'user_liked' => $this->resolveUserLiked($request),
            'user_saved' => $this->resolveUserSaved($request),
            'user_preorder_pending' => $viewer !== null
                && $this->availability_mode === AvailabilityMode::Preorder
                && app(ProductPreorderService::class)->findPendingForUser($viewer, $this->resource) !== null,
            'is_own_store' => $isOwnStore,
            'sales_stats' => $this->when($isVendorDashboardView, fn () => app(ProductSalesStatsService::class)->forProduct($this->resource)),
            'vendor' => $this->when($this->relationLoaded('vendorAccount') && $this->vendorAccount !== null, fn () => [
                'id' => $this->vendorAccount->id,
                'store_name' => $this->vendorAccount->business_name,
                'slug' => $this->vendorAccount->slug,
            ]),
            'category' => $this->when($this->relationLoaded('category') && $this->category !== null, fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'related_products' => $this->when(
                $this->relatedProducts !== null,
                fn () => ProductCardResource::collection($this->relatedProducts),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function resolveUserSaved(Request $request): bool
    {
        if (array_key_exists('user_saved', $this->resource->getAttributes())) {
            return (bool) $this->user_saved;
        }

        return app(ProductEngagementService::class)->userSaved($request->user(), $this->resource);
    }

    private function resolveUserLiked(Request $request): bool
    {
        if (array_key_exists('user_liked', $this->resource->getAttributes())) {
            return (bool) $this->user_liked;
        }

        return app(ProductEngagementService::class)->userLiked($request->user(), $this->resource);
    }

    /**
     * @param  array<string, mixed>|null  $materials
     * @return list<string>|array<string, string>|null
     */
    private function normalizeMaterials(?array $materials): ?array
    {
        if ($materials === null || $materials === []) {
            return null;
        }

        if (array_is_list($materials)) {
            return array_values(array_filter(array_map(
                static fn ($value) => is_string($value) ? trim($value) : null,
                $materials,
            )));
        }

        $normalized = [];
        foreach ($materials as $key => $value) {
            if (! is_string($value) || trim($value) === '') {
                continue;
            }
            $normalized[(string) $key] = trim($value);
        }

        return $normalized === [] ? null : $normalized;
    }
}
