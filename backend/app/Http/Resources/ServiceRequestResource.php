<?php

namespace App\Http\Resources;

use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceRequest */
class ServiceRequestResource extends JsonResource
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
            'reference_links' => $this->reference_links ?? [],
            'categories' => ServiceCategoryResource::collection($this->whenLoaded('categories')),
            'attachments' => ServiceRequestAttachmentResource::collection($this->whenLoaded('attachments')),
            'customer' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
            ]),
            'attachments_count' => (int) ($this->attachments_count ?? 0),
            'provider_has_offer' => (bool) ($this->provider_has_offer ?? false),
            'offers' => ServiceOfferResource::collection($this->whenLoaded('offers')),
            'accepted_offer' => $this->whenLoaded('acceptedOffer', fn () => $this->acceptedOffer
                ? new ServiceOfferResource($this->acceptedOffer)
                : null),
            'booking' => $this->whenLoaded('booking', fn () => $this->booking
                ? new ServiceBookingResource($this->booking)
                : null),
            'service' => $this->whenLoaded('service', fn () => $this->service ? [
                'id' => $this->service->id,
                'title' => $this->service->title,
                'slug' => $this->service->slug,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
