<?php

namespace App\Http\Resources;

use App\Models\Category;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Category */
class CategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type->value,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'image_url' => $media->url($this->image_path),
            'children' => $this->whenLoaded(
                'children',
                fn () => CategoryResource::collection($this->children)->resolve(),
                [],
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
