<?php

namespace App\Http\Resources;

use App\Models\BlogArticle;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BlogArticle */
class BlogArticleCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            'hero_image' => CmsImageUrl::resolve($this->hero_image),
            'author_name' => $this->author_name,
            'author_avatar' => CmsImageUrl::resolve($this->author_avatar),
            'author_role' => $this->author_role,
            'reading_time_minutes' => $this->reading_time_minutes,
            'published_at' => $this->published_at?->toIso8601String(),
            'category' => $this->when(
                $this->relationLoaded('category') && $this->category !== null,
                fn () => new BlogCategoryResource($this->category),
            ),
            'tags' => BlogTagResource::collection($this->whenLoaded('tags')),
        ];

        if ($request->is('api/v1/admin/*')) {
            $data['status'] = $this->status->value;
        }

        return $data;
    }
}
