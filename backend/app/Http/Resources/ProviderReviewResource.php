<?php

namespace App\Http\Resources;

use App\Models\ProviderReview;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProviderReview */
class ProviderReviewResource extends JsonResource
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
            'title' => $this->title,
            'comment' => $this->comment,
            'customer' => $this->when(
                $this->relationLoaded('user') && $this->user !== null,
                fn () => [
                    'name' => $this->user->name,
                    'avatar_url' => $media->url($this->user->avatar_path),
                ],
            ),
            'service' => $this->when(
                $this->relationLoaded('service') && $this->service !== null,
                fn () => [
                    'id' => $this->service->id,
                    'title' => $this->service->title,
                    'slug' => $this->service->slug,
                ],
            ),
            'provider_response' => $this->provider_response,
            'provider_responded_at' => $this->provider_responded_at?->toIso8601String(),
            'provider_responded_by' => $this->when(
                $this->provider_response !== null
                    && $this->relationLoaded('providerAccount')
                    && $this->providerAccount !== null,
                fn () => $this->providerAccount->business_name,
            ),
            'is_owner' => $request->user()?->id === $this->user_id,
            'can_reply' => $request->user()?->providerAccount?->id === $this->provider_account_id
                && $this->provider_response === null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
