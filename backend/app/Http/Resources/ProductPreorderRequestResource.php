<?php

namespace App\Http\Resources;

use App\Models\ProductPreorderRequest;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductPreorderRequest */
class ProductPreorderRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);
        $product = $this->relationLoaded('product') ? $this->product : null;
        $imagePath = $product?->images?->sortBy('sort_order')->first()?->mediaFile?->path;

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'unit_price' => (string) $this->unit_price,
            'selected_color' => $this->selected_color,
            'created_at' => $this->created_at?->toIso8601String(),
            'fulfilled_at' => $this->fulfilled_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'customer' => $this->when(
                $this->relationLoaded('user') && $this->user !== null,
                fn () => [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                    'avatar_url' => $media->url($this->user->avatar_path),
                ],
            ),
            'product' => $this->when(
                $product !== null,
                fn () => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image_url' => $media->url($imagePath),
                ],
            ),
        ];
    }
}
