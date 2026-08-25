<?php

namespace App\Http\Resources;

use App\Models\BlogArticle;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BlogArticle */
class BlogArticleDetailResource extends JsonResource
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
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'hero_image' => CmsImageUrl::resolve($this->hero_image),
            'author_name' => $this->author_name,
            'author_avatar' => CmsImageUrl::resolve($this->author_avatar),
            'author_role' => $this->author_role,
            'reading_time_minutes' => $this->reading_time_minutes,
            'published_at' => $this->published_at?->toIso8601String(),
            'status' => $this->status->value,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'category' => $this->when(
                $this->relationLoaded('category') && $this->category !== null,
                fn () => new BlogCategoryResource($this->category),
            ),
            'tags' => BlogTagResource::collection($this->whenLoaded('tags')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
