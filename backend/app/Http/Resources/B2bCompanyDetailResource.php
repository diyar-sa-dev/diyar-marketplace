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
            'address' => $this->when(
                $request->is('api/v1/admin/*') || $this->isPartnerDashboardRequest($request),
                $this->address,
            ),
            'phone' => $this->phone,
            'email' => $this->email,
            'website' => $this->website,
            'business_hours' => $this->business_hours,
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
            'category' => $this->resolveCategory(),
            'tags' => B2bTagResource::collection($this->whenLoaded('tags')),
            'services' => B2bCompanyServiceResource::collection($this->whenLoaded('services')),
            'portfolio_gallery' => B2bCompanyPortfolioImageResource::collection($this->whenLoaded('portfolioImages')),
            'testimonials' => B2bCompanyTestimonialResource::collection($this->whenLoaded('testimonials')),
            'customer_reviews' => B2bCompanyReviewResource::collection($this->whenLoaded('customerReviews')),
            'portfolio' => ProjectCardResource::collection($this->whenLoaded('projects')),
        ];

        if ($request->is('api/v1/admin/*') || $this->isPartnerDashboardRequest($request)) {
            $data['id'] = $this->id;
            $data['b2b_category_id'] = $this->b2b_category_id;
            $data['custom_category'] = $this->custom_category;
            $data['publication_status'] = $this->publication_status->value;
            $data['verification_status'] = $this->verification_status->value;
            $data['published_at'] = $this->published_at?->toIso8601String();
            $data['address'] = $this->address;
            $data['years_experience'] = $this->years_experience;
            $data['team_size'] = $this->team_size;
            $data['completed_projects'] = (int) $this->completed_projects;
            $data['tag_ids'] = $this->whenLoaded('tags', fn () => $this->tags->pluck('id')->values());
        }

        if ($request->is('api/v1/admin/*')) {
            $data['admin_notes'] = $this->admin_notes;
            $data['owner_user_id'] = $this->owner_user_id;
            $data['vendor_account_id'] = $this->vendor_account_id;
            $data['provider_account_id'] = $this->provider_account_id;
            $data['project_ids'] = $this->whenLoaded('projects', fn () => $this->projects->pluck('id')->values());
        }

        return $data;
    }

    private function isPartnerDashboardRequest(Request $request): bool
    {
        return $request->is('api/v1/dashboard/vendor/b2b/*')
            || $request->is('api/v1/dashboard/provider/b2b/*');
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
