<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingSource;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServicePaymentStrategy;
use App\Enums\ServiceRequestStatus;
use App\Events\Domain\BookingCompleted;
use App\Events\Domain\BookingCreated;
use App\Models\Service;
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
    public function __construct(
        private readonly ProviderAvailabilityService $availability,
    ) {}

    /**
     * @return list<ServiceBookingStatus>
     */
    public static function activeCustomerStatuses(): array
    {
        return [
            ServiceBookingStatus::PendingProviderConfirmation,
            ServiceBookingStatus::PendingCustomerAcceptance,
            ServiceBookingStatus::PendingPayment,
            ServiceBookingStatus::Confirmed,
            ServiceBookingStatus::InProgress,
        ];
    }

    public function findActiveForUserAndService(User $user, Service $service): ?ServiceBooking
    {
        return ServiceBooking::query()
            ->where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->whereIn('status', self::activeCustomerStatuses())
            ->latest()
            ->first();
    }

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
            $offerDate = $offer->proposed_scheduled_date?->format('Y-m-d');
            $offerTime = $offer->proposed_scheduled_time !== null
                ? substr((string) $offer->proposed_scheduled_time, 0, 5)
                : null;

            $booking = ServiceBooking::query()->create([
                'service_offer_id' => $offer->id,
                'service_request_id' => $request->id,
                'user_id' => $user->id,
                'provider_account_id' => $offer->provider_account_id,
                'service_id' => $request->service_id,
                'booking_source' => ServiceBookingSource::Rfq,
                'reference' => $this->allocateReference('SBK'),
                'scheduled_date' => $offerDate,
                'scheduled_time' => $offerTime,
                'requested_scheduled_date' => $offerDate,
                'requested_scheduled_time' => $offerTime,
                'location' => isset($payload['location']) ? trim((string) $payload['location']) : $request->location,
                'customer_notes' => isset($payload['customer_notes']) ? trim((string) $payload['customer_notes']) : null,
                'price' => $offer->proposed_price,
                'currency' => $offer->currency,
                'payment_strategy' => $payload['payment_strategy'] ?? ServicePaymentStrategy::Full,
                'payment_status' => ServiceBookingPaymentStatus::Pending,
                'status' => ServiceBookingStatus::PendingProviderConfirmation,
            ]);

            $fresh = $booking->fresh(['payment', 'providerAccount', 'serviceOffer', 'user']);
            DB::afterCommit(fn () => event(new BookingCreated($fresh)));

            return $fresh;
        });
    }

    public function listForCustomer(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return ServiceBooking::query()
            ->where('user_id', $user->id)
            ->with(['providerAccount', 'serviceRequest', 'service.category', 'payment', 'providerReview'])
            ->latest()
            ->paginate(perPage: $perPage, page: $page);
    }

    public function listForProvider(User $user, int $page, int $perPage, ?string $status = null, ?string $search = null): LengthAwarePaginator
    {
        $provider = ProviderAccountResolver::forUser($user);

        $query = ServiceBooking::query()
            ->where('provider_account_id', $provider->id)
            ->with(['user:id,name,phone,email', 'serviceRequest', 'service.category', 'serviceOffer', 'payment'])
            ->latest();

        if ($status !== null && $status !== '' && $status !== 'all') {
            if ($status === 'pending') {
                $query->whereIn('status', [
                    ServiceBookingStatus::PendingProviderConfirmation,
                    ServiceBookingStatus::PendingCustomerAcceptance,
                    ServiceBookingStatus::PendingPayment,
                ]);
            } elseif ($status === 'upcoming') {
                $query->whereIn('status', [ServiceBookingStatus::Confirmed, ServiceBookingStatus::InProgress]);
            } elseif ($status === 'completed') {
                $query->where('status', ServiceBookingStatus::Completed);
            } elseif ($status === 'cancelled') {
                $query->where('status', ServiceBookingStatus::Cancelled);
            }
        }

        if ($search !== null && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function ($q) use ($term) {
                $q->where('reference', 'like', $term)
                    ->orWhere('location', 'like', $term)
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', $term))
                    ->orWhereHas('serviceRequest', fn ($reqQuery) => $reqQuery
                        ->where('title', 'like', $term)
                        ->orWhere('reference', 'like', $term));
            });
        }

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function findForParticipant(User $user, string $id): ServiceBooking
    {
        $booking = ServiceBooking::query()
            ->with(['payment', 'providerAccount', 'serviceRequest', 'serviceOffer', 'service.category', 'providerReview', 'user:id,name,phone,email'])
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

        $fresh = $booking->fresh(['payment', 'providerAccount', 'user']);
        DB::afterCommit(fn () => event(new BookingCompleted($fresh)));

        return $fresh;
    }

    public function confirmByProvider(User $user, ServiceBooking $booking): ServiceBooking
    {
        $this->assertProviderOwnsBooking($user, $booking);

        if ($booking->status !== ServiceBookingStatus::PendingProviderConfirmation) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        return DB::transaction(function () use ($booking) {
            $this->moveToPendingPayment($booking);

            return $booking->fresh(['payment', 'providerAccount', 'service', 'user:id,name,phone,email']);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function proposeRescheduleByProvider(User $user, ServiceBooking $booking, array $payload): ServiceBooking
    {
        $this->assertProviderOwnsBooking($user, $booking);

        if ($booking->status !== ServiceBookingStatus::PendingProviderConfirmation) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        $proposedDate = (string) ($payload['proposed_scheduled_date'] ?? '');
        $proposedTime = (string) ($payload['proposed_scheduled_time'] ?? '');

        if ($proposedDate === '' || $proposedTime === '') {
            throw new InvalidArgumentException(__('diyar.services.bookings.schedule_required'));
        }

        $durationMinutes = $this->availability->defaultDurationMinutes($booking->duration_minutes);
        $provider = $booking->providerAccount;

        if ($provider === null) {
            throw new InvalidArgumentException(__('diyar.services.provider_not_available'));
        }

        $this->availability->assertMinimumLeadTime($proposedDate, $proposedTime);
        $this->availability->assertSlotAvailable(
            $provider,
            $proposedDate,
            $proposedTime,
            $durationMinutes,
            null,
            $booking->id,
        );

        $booking->update([
            'status' => ServiceBookingStatus::PendingCustomerAcceptance,
            'proposed_scheduled_date' => $proposedDate,
            'proposed_scheduled_time' => substr($proposedTime, 0, 5),
            'last_proposed_scheduled_date' => $proposedDate,
            'last_proposed_scheduled_time' => substr($proposedTime, 0, 5),
            'schedule_proposed_at' => now(),
            'provider_notes' => isset($payload['provider_notes'])
                ? trim((string) $payload['provider_notes'])
                : $booking->provider_notes,
        ]);

        return $booking->fresh(['payment', 'providerAccount', 'service', 'user:id,name,phone,email']);
    }

    public function acceptScheduleByCustomer(User $user, ServiceBooking $booking): ServiceBooking
    {
        if ($booking->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($booking->status !== ServiceBookingStatus::PendingCustomerAcceptance) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        return DB::transaction(function () use ($booking) {
            $updates = [
                'proposed_scheduled_date' => null,
                'proposed_scheduled_time' => null,
                'schedule_proposed_at' => null,
            ];

            if ($booking->proposed_scheduled_date !== null && $booking->proposed_scheduled_time !== null) {
                $updates['scheduled_date'] = $booking->proposed_scheduled_date;
                $updates['scheduled_time'] = $booking->proposed_scheduled_time;
                $updates['last_proposed_scheduled_date'] = $booking->proposed_scheduled_date;
                $updates['last_proposed_scheduled_time'] = $booking->proposed_scheduled_time;
            }

            $booking->update($updates);
            $this->moveToPendingPayment($booking->fresh());

            return $booking->fresh(['payment', 'providerAccount', 'service']);
        });
    }

    public function declineScheduleByCustomer(User $user, ServiceBooking $booking): ServiceBooking
    {
        if ($booking->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($booking->status !== ServiceBookingStatus::PendingCustomerAcceptance) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        $booking->update([
            'status' => ServiceBookingStatus::Cancelled,
            'cancelled_at' => now(),
            'proposed_scheduled_date' => null,
            'proposed_scheduled_time' => null,
            'schedule_proposed_at' => null,
        ]);

        return $booking->fresh(['payment', 'providerAccount', 'service']);
    }

    public function cancelByCustomer(User $user, ServiceBooking $booking): ServiceBooking
    {
        if ($booking->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if (! in_array($booking->status, [
            ServiceBookingStatus::PendingProviderConfirmation,
            ServiceBookingStatus::PendingCustomerAcceptance,
            ServiceBookingStatus::PendingPayment,
        ], true)) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        $booking->update([
            'status' => ServiceBookingStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $booking->fresh(['payment', 'providerAccount', 'service']);
    }

    public function cancelByProvider(User $user, ServiceBooking $booking): ServiceBooking
    {
        $this->assertProviderOwnsBooking($user, $booking);

        if (! in_array($booking->status, [
            ServiceBookingStatus::PendingProviderConfirmation,
            ServiceBookingStatus::PendingCustomerAcceptance,
            ServiceBookingStatus::PendingPayment,
        ], true)) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        if ($booking->payment_status === ServiceBookingPaymentStatus::Paid) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_transition'));
        }

        $booking->update([
            'status' => ServiceBookingStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $booking->fresh(['payment', 'providerAccount']);
    }

    private function moveToPendingPayment(ServiceBooking $booking): void
    {
        $booking->update(['status' => ServiceBookingStatus::PendingPayment]);

        ServiceBookingPayment::query()->firstOrCreate(
            ['service_booking_id' => $booking->id],
            [
                'status' => ServiceBookingPaymentStatus::Pending,
                'amount' => $booking->price,
                'currency' => $booking->currency,
                'gateway' => config('payments.default_gateway', 'local'),
            ],
        );
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
