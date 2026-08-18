<?php

namespace App\Http\Resources;

use App\Models\ServiceBooking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceBooking */
class ServiceBookingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'service_request_id' => $this->service_request_id,
            'service_offer_id' => $this->service_offer_id,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'payment_strategy' => $this->payment_strategy->value,
            'price' => $this->price,
            'currency' => $this->currency,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'scheduled_time' => $this->scheduled_time,
            'location' => $this->location,
            'customer_notes' => $this->customer_notes,
            'provider_notes' => $this->provider_notes,
            'provider' => $this->whenLoaded('providerAccount', fn () => [
                'id' => $this->providerAccount->id,
                'name' => $this->providerAccount->business_name,
                'slug' => $this->providerAccount->slug,
            ]),
            'customer' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
            ]),
            'service_title' => $this->whenLoaded('serviceRequest', fn () => $this->serviceRequest?->title),
            'service_request' => $this->whenLoaded('serviceRequest', fn () => $this->serviceRequest ? [
                'id' => $this->serviceRequest->id,
                'title' => $this->serviceRequest->title,
                'description' => $this->serviceRequest->description,
            ] : null),
            'payment' => $this->whenLoaded('payment', fn () => $this->payment
                ? new ServiceBookingPaymentResource($this->payment)
                : null),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
