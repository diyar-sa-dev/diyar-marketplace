<?php

namespace App\Http\Resources;

use App\Models\Product;
use App\Services\Catalog\ProductEngagementService;
use App\Services\Media\MediaUploadService;
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

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'sale_price' => $this->sale_price,
            'compare_price' => $this->compare_price,
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
            'user_liked' => $engagement->userLiked($request->user(), $this->resource),
            'user_saved' => $engagement->userSaved($request->user(), $this->resource),
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
