<?php

namespace App\Http\Resources;

use App\Models\ProviderAccount;
use App\Services\ServiceMarketplace\ProviderFollowService;
use App\Support\ServiceMarketplace\ServiceMarketplacePresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProviderAccount */
class ProviderPublicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $presenter = app(ServiceMarketplacePresenter::class);
        $follow = app(ProviderFollowService::class)->summary($this->resource, $request->user());

        return [
            'id' => $this->id,
            'display_name' => $this->business_name,
            'slug' => $this->slug,
            'bio' => $this->bio,
            'avatar_url' => $presenter->mediaUrl($this->avatar_path),
            'cover_url' => $presenter->mediaUrl($this->cover_path),
            'location' => $this->location,
            'remote_available' => $this->remote_available,
            'verified' => $this->verified,
            'badges' => $this->badges ?? [],
            'working_hours' => $presenter->formatWorkingHours($this->working_hours),
            'work_policy_summary' => $presenter->workPolicySummary(
                $this->relationLoaded('workPolicy') ? $this->workPolicy : null,
            ),
            'completed_projects_count' => $this->completed_projects_count,
            'active_services_count' => $this->when(isset($this->active_services_count), (int) $this->active_services_count),
            'rating_average' => (float) $this->rating_average,
            'reviews_count' => $this->reviews_count,
            'joined_at' => $this->joined_at?->toIso8601String(),
            'follow' => $follow,
            'is_own_provider' => $request->user()?->providerAccount?->id === $this->id,
            'contact_phone' => $this->when(
                $this->relationLoaded('user') && filled($this->user?->phone),
                fn () => $this->user->phone,
            ),
        ];
    }
}
