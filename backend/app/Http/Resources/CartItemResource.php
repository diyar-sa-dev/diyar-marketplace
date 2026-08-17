<?php

namespace App\Http\Resources;

use App\Models\CartItem;
use App\Services\Catalog\ProductEngagementService;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CartItem */
class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $product = $this->relationLoaded('product') ? $this->product : null;
        $firstImage = $product?->relationLoaded('images') ? $product->images->first() : null;

        $productPayload = null;
        if ($product !== null) {
            $engagement = app(ProductEngagementService::class);
            $productPayload = [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sale_price' => $product->sale_price,
                'availability_mode' => $product->availability_mode->value,
                'image_url' => $firstImage?->relationLoaded('mediaFile')
                    ? $media->url($firstImage->mediaFile->path)
                    : null,
                'vendor' => $product->relationLoaded('vendorAccount') && $product->vendorAccount !== null
                    ? [
                        'vendor_account_id' => $product->vendor_account_id,
                        'store_name' => $product->vendorAccount->business_name,
                        'slug' => $product->vendorAccount->slug,
                    ]
                    : null,
                'inventory' => $product->relationLoaded('inventory') && $product->inventory !== null
                    ? ['available_quantity' => $product->inventory->available_quantity]
                    : null,
                'dimensions' => [
                    'width' => $product->width,
                    'height' => $product->height,
                    'depth' => $product->depth,
                ],
                'user_saved' => $engagement->userSaved($request->user(), $product),
            ];
        }

        $colorName = $this->color_name !== '' ? $this->color_name : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'unit_price_snapshot' => $this->unit_price_snapshot,
            'line_subtotal' => bcmul((string) $this->unit_price_snapshot, (string) $this->quantity, 2),
            'color' => $colorName !== null
                ? ['name' => $colorName, 'hex_code' => $this->color_hex]
                : null,
            'product' => $productPayload,
        ];
    }
}
