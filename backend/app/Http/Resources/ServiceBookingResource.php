<?php

namespace App\Http\Resources;

use App\Enums\ServiceBookingStatus;
use App\Models\ServiceBooking;
use App\Models\User;
use App\Services\ServiceMarketplace\ProviderReviewEligibility;
use App\Support\ServiceMarketplace\ServiceMarketplacePresenter;
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
        $eligibility = app(ProviderReviewEligibility::class);
        $user = $request->user();
        $canReview = $user !== null && $eligibility->canReview($user, $this->resource);

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'booking_source' => $this->booking_source?->value,
            'service_request_id' => $this->service_request_id,
            'service_offer_id' => $this->service_offer_id,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'payment_strategy' => $this->payment_strategy->value,
            'price' => $this->price,
            'currency' => $this->currency,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'scheduled_time' => $this->scheduled_time !== null ? substr((string) $this->scheduled_time, 0, 5) : null,
            'requested_scheduled_date' => $this->requested_scheduled_date?->toDateString(),
            'requested_scheduled_time' => $this->requested_scheduled_time !== null
                ? substr((string) $this->requested_scheduled_time, 0, 5)
                : null,
            'proposed_scheduled_date' => $this->proposed_scheduled_date?->toDateString(),
            'proposed_scheduled_time' => $this->proposed_scheduled_time !== null
                ? substr((string) $this->proposed_scheduled_time, 0, 5)
                : null,
            'schedule_proposed_at' => $this->schedule_proposed_at?->toIso8601String(),
            'last_proposed_scheduled_date' => $this->last_proposed_scheduled_date?->toDateString(),
            'last_proposed_scheduled_time' => $this->last_proposed_scheduled_time !== null
                ? substr((string) $this->last_proposed_scheduled_time, 0, 5)
                : null,
            'duration_minutes' => $this->duration_minutes,
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
                'phone' => $this->user->phone,
                'email' => $this->user->email,
            ]),
            'service_title' => $this->service_title_snapshot
                ?? ($this->relationLoaded('serviceRequest') ? $this->serviceRequest?->title : null)
                ?? ($this->relationLoaded('service') ? $this->service?->title : null),
            'service' => $this->whenLoaded('service', fn () => $this->formatServiceSummary()),
            'service_request' => $this->whenLoaded('serviceRequest', fn () => $this->serviceRequest ? [
                'id' => $this->serviceRequest->id,
                'reference' => $this->serviceRequest->reference,
                'title' => $this->serviceRequest->title,
                'description' => $this->serviceRequest->description,
                'location' => $this->serviceRequest->location,
                'budget_min' => $this->serviceRequest->budget_min !== null
                    ? (float) $this->serviceRequest->budget_min
                    : null,
                'budget_max' => $this->serviceRequest->budget_max !== null
                    ? (float) $this->serviceRequest->budget_max
                    : null,
            ] : null),
            'service_offer' => $this->whenLoaded('serviceOffer', fn () => $this->serviceOffer ? [
                'proposed_scheduled_date' => $this->serviceOffer->proposed_scheduled_date?->format('Y-m-d'),
                'proposed_scheduled_time' => $this->serviceOffer->proposed_scheduled_time !== null
                    ? substr((string) $this->serviceOffer->proposed_scheduled_time, 0, 5)
                    : null,
                'proposed_price' => $this->serviceOffer->proposed_price,
                'currency' => $this->serviceOffer->currency,
            ] : null),
            'payment' => $this->whenLoaded('payment', fn () => $this->payment
                ? new ServiceBookingPaymentResource($this->payment)
                : null),
            'can_review' => $canReview,
            'can_pay' => $user !== null
                && $user->id === $this->user_id
                && $this->status === ServiceBookingStatus::PendingPayment,
            'can_accept_schedule' => $user !== null
                && $user->id === $this->user_id
                && $this->status === ServiceBookingStatus::PendingCustomerAcceptance,
            'can_decline_schedule' => $user !== null
                && $user->id === $this->user_id
                && $this->status === ServiceBookingStatus::PendingCustomerAcceptance,
            'can_cancel' => $user !== null && $this->canParticipantCancel($user),
            'can_confirm' => $user !== null
                && $user->providerAccount?->id === $this->provider_account_id
                && $this->status === ServiceBookingStatus::PendingProviderConfirmation,
            'can_propose_schedule' => $user !== null
                && $user->providerAccount?->id === $this->provider_account_id
                && $this->status === ServiceBookingStatus::PendingProviderConfirmation,
            'review' => $this->whenLoaded('providerReview', fn () => $this->providerReview
                ? new ProviderReviewResource($this->providerReview)
                : null),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function canParticipantCancel(User $user): bool
    {
        if ($user->id === $this->user_id) {
            return in_array($this->status, [
                ServiceBookingStatus::PendingProviderConfirmation,
                ServiceBookingStatus::PendingCustomerAcceptance,
                ServiceBookingStatus::PendingPayment,
            ], true);
        }

        if ($user->providerAccount?->id === $this->provider_account_id) {
            return in_array($this->status, [
                ServiceBookingStatus::PendingProviderConfirmation,
                ServiceBookingStatus::PendingCustomerAcceptance,
                ServiceBookingStatus::PendingPayment,
                ServiceBookingStatus::Confirmed,
            ], true);
        }

        return false;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function formatServiceSummary(): ?array
    {
        if ($this->service === null) {
            return null;
        }

        $presenter = app(ServiceMarketplacePresenter::class);
        $locale = app()->getLocale();
        $categoryName = $this->service->relationLoaded('category') && $this->service->category !== null
            ? ($locale === 'ar' ? $this->service->category->name_ar : $this->service->category->name_en)
            : null;

        return [
            'id' => $this->service->id,
            'title' => $this->service->title,
            'slug' => $this->service->slug,
            'description' => $this->service->description,
            'duration_label' => $this->service->duration_label,
            'service_type_label' => $this->service->delivery_type_label,
            'pricing_label' => $presenter->pricingLabel(
                $this->service->pricing_mode,
                $this->service->starting_price !== null ? (float) $this->service->starting_price : null,
                $this->service->currency,
            ),
            'image_url' => $presenter->mediaUrl($this->service->cover_path),
            'category' => $categoryName !== null && $this->service->category !== null ? [
                'slug' => $this->service->category->slug,
                'name' => $categoryName,
            ] : null,
        ];
    }
}
