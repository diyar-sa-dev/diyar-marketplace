<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServicePaymentStrategy;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceBookingPayment;
use App\Models\ServiceOffer;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ServiceBookingService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function createFromAcceptedOffer(User $user, ServiceOffer $offer, array $payload = []): ServiceBooking
    {
        $request = $offer->serviceRequest;

        if ($request->booking()->exists()) {
            throw new InvalidArgumentException(__('diyar.services.bookings.already_exists'));
        }

        return DB::transaction(function () use ($user, $offer, $request, $payload) {
            $booking = ServiceBooking::query()->create([
                'service_offer_id' => $offer->id,
                'service_request_id' => $request->id,
                'user_id' => $user->id,
                'provider_account_id' => $offer->provider_account_id,
                'service_id' => $request->service_id,
                'reference' => $this->allocateReference('SBK'),
                'scheduled_date' => $payload['scheduled_date'] ?? null,
                'scheduled_time' => $payload['scheduled_time'] ?? null,
                'location' => isset($payload['location']) ? trim((string) $payload['location']) : $request->location,
                'customer_notes' => isset($payload['customer_notes']) ? trim((string) $payload['customer_notes']) : null,
                'price' => $offer->proposed_price,
                'currency' => $offer->currency,
                'payment_strategy' => $payload['payment_strategy'] ?? ServicePaymentStrategy::Full,
                'payment_status' => ServiceBookingPaymentStatus::Pending,
                'status' => ServiceBookingStatus::PendingPayment,
            ]);

            ServiceBookingPayment::query()->create([
                'service_booking_id' => $booking->id,
                'status' => ServiceBookingPaymentStatus::Pending,
                'amount' => $booking->price,
                'currency' => $booking->currency,
                'gateway' => config('payments.default_gateway', 'local'),
            ]);

            return $booking->fresh(['payment', 'providerAccount', 'serviceOffer']);
        });
    }

    public function listForCustomer(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return ServiceBooking::query()
            ->where('user_id', $user->id)
            ->with(['providerAccount', 'serviceRequest', 'payment'])
            ->latest()
            ->paginate(perPage: $perPage, page: $page);
    }

    public function listForProvider(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        $provider = ProviderAccountResolver::forUser($user);

        return ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->with(['user:id,name', 'serviceRequest', 'payment'])
            ->latest()
            ->paginate(perPage: $perPage, page: $page);
    }

    public function findForParticipant(User $user, string $id): ServiceBooking
    {
        $booking = ServiceBooking::query()
            ->with(['payment', 'providerAccount', 'serviceRequest', 'serviceOffer'])
            ->whereKey($id)
            ->first();

        if ($booking === null) {
            throw new NotFoundHttpException(__('diyar.services.bookings.not_found'));
        }

        $providerUserId = $booking->providerAccount?->user_id;
        if ($booking->user_id !== $user->id && $providerUserId !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $booking;
    }

    public function markInProgress(User $user, ServiceBooking $booking): ServiceBooking
    {
        $this->assertProviderOwnsBooking($user, $booking);

        if ($booking->status !== ServiceBookingStatus::Confirmed) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        $booking->update(['status' => ServiceBookingStatus::InProgress]);
        $booking->serviceRequest?->update(['status' => ServiceRequestStatus::InProgress]);

        return $booking->fresh(['payment', 'providerAccount']);
    }

    public function markCompleted(User $user, ServiceBooking $booking): ServiceBooking
    {
        $this->assertProviderOwnsBooking($user, $booking);

        if (! in_array($booking->status, [ServiceBookingStatus::Confirmed, ServiceBookingStatus::InProgress], true)) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        $booking->update([
            'status' => ServiceBookingStatus::Completed,
            'completed_at' => now(),
        ]);

        $booking->serviceRequest?->update(['status' => ServiceRequestStatus::Completed]);

        return $booking->fresh(['payment', 'providerAccount']);
    }

    private function assertProviderOwnsBooking(User $user, ServiceBooking $booking): void
    {
        if ($booking->providerAccount?->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }
    }

    private function allocateReference(string $prefix): string
    {
        $date = now()->format('Ymd');
        $count = ServiceBooking::query()->whereDate('created_at', today())->count() + 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $count);
    }
}
