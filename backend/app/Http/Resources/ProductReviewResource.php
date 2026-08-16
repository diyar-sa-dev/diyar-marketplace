<?php

namespace App\Http\Resources;

use App\Models\ProductReview;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductReview */
class ProductReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'author_name' => $this->when(
                $this->relationLoaded('user') && $this->user !== null,
                fn () => $this->user->name,
            ),
            'author_avatar_url' => $this->when(
                $this->relationLoaded('user') && $this->user !== null,
                fn () => $media->url($this->user->avatar_path),
            ),
            'is_owner' => $request->user()?->id === $this->user_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
