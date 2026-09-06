<?php

namespace App\Http\Resources;

use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceRequest */
class ServiceRequestCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'budget_min' => $this->budget_min,
            'budget_max' => $this->budget_max,
            'location' => $this->location,
            'offers_count' => (int) ($this->offers_count ?? 0),
            'categories' => ServiceCategoryResource::collection($this->whenLoaded('categories')),
            'accepted_provider' => $this->whenLoaded('acceptedOffer', function () {
                $provider = $this->acceptedOffer?->providerAccount;

                return $provider ? [
                    'id' => $provider->id,
                    'name' => $provider->business_name,
                    'slug' => $provider->slug,
                ] : null;
            }),
            'accepted_price' => $this->whenLoaded('acceptedOffer', fn () => $this->acceptedOffer?->proposed_price),
            'accepted_currency' => $this->whenLoaded('acceptedOffer', fn () => $this->acceptedOffer?->currency),
            'customer' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
            ]),
            'attachments_count' => (int) ($this->attachments_count ?? 0),
            'provider_has_offer' => (bool) ($this->provider_has_offer ?? false),
            'booking' => $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => $this->booking->id,
                'reference' => $this->booking->reference,
                'status' => $this->booking->status->value,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
