<?php

namespace App\Http\Resources;

use App\Models\StoreReview;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StoreReview */
class StoreReviewResource extends JsonResource
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
            'vendor_reply' => $this->vendor_reply,
            'vendor_replied_at' => $this->vendor_replied_at?->toIso8601String(),
            'vendor_replied_by' => $this->when(
                $this->vendor_reply !== null
                    && $this->relationLoaded('vendorAccount')
                    && $this->vendorAccount !== null,
                fn () => $this->vendorAccount->business_name,
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
