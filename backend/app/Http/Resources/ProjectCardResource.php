<?php

namespace App\Http\Resources;

use App\Models\Project;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Project */
class ProjectCardResource extends JsonResource
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
            'images_count' => $this->when(
                $this->relationLoaded('images') || isset($this->images_count),
                fn () => $this->images_count ?? $this->images->count(),
            ),
        ];
    }
}
