<?php

namespace App\Http\Resources;

use App\Models\Project;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Project */
class ProjectDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'location' => $this->location,
            'year' => $this->year,
            'cover_image' => CmsImageUrl::resolve($this->cover_image),
            'published_at' => $this->published_at?->toIso8601String(),
            'status' => $this->status->value,
            'images' => $this->when($this->relationLoaded('images'), fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'image_url' => CmsImageUrl::resolve($image->image_url),
                'alt' => $image->alt,
                'sort_order' => $image->sort_order,
            ])->values()->all()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
