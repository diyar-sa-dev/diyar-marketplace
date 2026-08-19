<?php

namespace App\Http\Resources;

use App\Models\ServiceOffer;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceOffer */
class ServiceOfferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'service_request_id' => $this->service_request_id,
            'proposed_price' => $this->proposed_price,
            'currency' => $this->currency,
            'duration_days' => $this->duration_days,
            'proposed_scheduled_date' => $this->proposed_scheduled_date?->format('Y-m-d'),
            'proposed_scheduled_time' => $this->proposed_scheduled_time,
            'message' => $this->message,
            'status' => $this->status->value,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'quotation' => $this->quotation_path ? [
                'original_name' => $this->quotation_original_name,
                'url' => $media->url($this->quotation_path),
            ] : null,
            'provider' => $this->whenLoaded('providerAccount', fn () => [
                'id' => $this->providerAccount->id,
                'name' => $this->providerAccount->business_name,
                'slug' => $this->providerAccount->slug,
                'rating_average' => (float) $this->providerAccount->rating_average,
                'reviews_count' => (int) $this->providerAccount->reviews_count,
            ]),
            'booking' => $this->whenLoaded('booking', fn () => $this->booking
                ? new ServiceBookingResource($this->booking)
                : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
