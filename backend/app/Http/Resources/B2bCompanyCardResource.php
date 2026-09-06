<?php

namespace App\Http\Resources;

use App\Enums\B2bVerificationStatus;
use App\Models\B2bCompany;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bCompany */
class B2bCompanyCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'logo' => CmsImageUrl::resolve($this->logo),
            'cover_image' => CmsImageUrl::resolve($this->cover_image),
            'location' => $this->location,
            'rating' => (float) $this->rating,
            'reviews_count' => (int) $this->reviews_count,
            'verified' => $this->verification_status === B2bVerificationStatus::Verified,
            'featured' => (bool) $this->featured,
            'category' => $this->resolveCategory(),
            'tags' => B2bTagResource::collection($this->whenLoaded('tags')),
        ];

        if ($request->is('api/v1/admin/*')) {
            $data['id'] = $this->id;
            $data['custom_category'] = $this->custom_category;
            $data['publication_status'] = $this->publication_status->value;
            $data['verification_status'] = $this->verification_status->value;
            $data['published_at'] = $this->published_at?->toIso8601String();
        }

        return $data;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveCategory(): ?array
    {
        if ($this->custom_category) {
            return [
                'id' => null,
                'slug' => 'other',
                'name' => $this->custom_category,
            ];
        }

        if ($this->relationLoaded('category') && $this->category !== null) {
            return (new B2bCategoryResource($this->category))->resolve();
        }

        return null;
    }
}
