<?php

namespace App\Http\Resources;

use App\Models\OrderItem;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrderItem */
class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $product = $this->relationLoaded('product') ? $this->product : null;
        $firstImage = $product?->relationLoaded('images') ? $product->images->first() : null;

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_slug' => $this->product_slug,
            'unit_price' => number_format((float) $this->unit_price, 2, '.', ''),
            'quantity' => $this->quantity,
            'line_subtotal' => number_format((float) $this->line_subtotal, 2, '.', ''),
            'color' => [
                'name' => $this->color_name,
                'hex_code' => $this->color_hex,
            ],
            'image_url' => $firstImage?->relationLoaded('mediaFile') && $firstImage->mediaFile !== null
                ? $media->url($firstImage->mediaFile->path)
                : null,
            'category_name' => $product?->relationLoaded('category') ? $product->category?->name : null,
        ];
    }
}
