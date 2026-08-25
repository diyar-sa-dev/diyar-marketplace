<?php

namespace App\Http\Resources;

use App\Enums\B2bVerificationStatus;
use App\Models\B2bCompany;
use App\Services\B2b\B2bService;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bCompany */
class B2bCompanyDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var B2bService $b2b */
        $b2b = app(B2bService::class);

        $data = [
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'about' => $this->about,
            'logo' => CmsImageUrl::resolve($this->logo),
            'cover_image' => CmsImageUrl::resolve($this->cover_image),
            'location' => $this->location,
            'address' => $this->when($request->is('api/v1/admin/*'), $this->address),
            'phone' => $this->phone,
            'email' => $this->email,
            'website' => $this->website,
            'rating' => (float) $this->rating,
            'reviews_count' => (int) $this->reviews_count,
            'verified' => $this->verification_status === B2bVerificationStatus::Verified,
            'featured' => (bool) $this->featured,
            'stats' => [
                'years_experience' => $this->years_experience,
                'team_size' => $this->team_size,
                'team_size_label' => $b2b->formatTeamSizeLabel($this->team_size),
                'completed_projects' => (int) $this->completed_projects,
            ],
            'category' => $this->when(
                $this->relationLoaded('category') && $this->category !== null,
                fn () => new B2bCategoryResource($this->category),
            ),
            'tags' => B2bTagResource::collection($this->whenLoaded('tags')),
            'services' => B2bCompanyServiceResource::collection($this->whenLoaded('services')),
            'testimonials' => B2bCompanyTestimonialResource::collection($this->whenLoaded('testimonials')),
            'portfolio' => ProjectCardResource::collection($this->whenLoaded('projects')),
        ];

        if ($request->is('api/v1/admin/*')) {
            $data['id'] = $this->id;
            $data['publication_status'] = $this->publication_status->value;
            $data['verification_status'] = $this->verification_status->value;
            $data['published_at'] = $this->published_at?->toIso8601String();
            $data['admin_notes'] = $this->admin_notes;
            $data['owner_user_id'] = $this->owner_user_id;
            $data['vendor_account_id'] = $this->vendor_account_id;
            $data['provider_account_id'] = $this->provider_account_id;
            $data['address'] = $this->address;
            $data['project_ids'] = $this->whenLoaded('projects', fn () => $this->projects->pluck('id')->values());
            $data['tag_ids'] = $this->whenLoaded('tags', fn () => $this->tags->pluck('id')->values());
        }

        return $data;
    }
}
