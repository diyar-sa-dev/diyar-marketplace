<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ProviderAccountStatus;
use App\Enums\ServiceBookingMode;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingSource;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServicePaymentStrategy;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class DirectServiceBookingService
{
    public function __construct(
        private readonly ProviderAvailabilityService $availability,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function preview(User $user, Service $service, array $payload): array
    {
        $service = $this->resolveDirectBookableService($service);
        $provider = $service->providerAccount;
        $durationMinutes = $this->availability->defaultDurationMinutes($service->duration_minutes);
        $scheduledDate = (string) ($payload['scheduled_date'] ?? '');
        $scheduledTime = (string) ($payload['scheduled_time'] ?? '');

        if ($scheduledDate !== '' && $scheduledTime !== '') {
            $this->availability->assertSlotAvailable(
                $provider,
                $scheduledDate,
                $scheduledTime,
                $durationMinutes,
            );
        }

        return [
            'service' => [
                'id' => $service->id,
                'title' => $service->title,
                'slug' => $service->slug,
                'duration_minutes' => $durationMinutes,
                'duration_label' => $service->duration_label,
            ],
            'provider' => [
                'id' => $provider->id,
                'display_name' => $provider->business_name,
                'slug' => $provider->slug,
            ],
            'price' => number_format((float) $service->starting_price, 2, '.', ''),
            'currency' => $service->currency,
            'scheduled_date' => $scheduledDate !== '' ? $scheduledDate : null,
            'scheduled_time' => $scheduledTime !== '' ? substr($scheduledTime, 0, 5) : null,
            'location' => $payload['location'] ?? $service->location,
            'customer_notes' => isset($payload['customer_notes']) ? trim((string) $payload['customer_notes']) : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(User $user, Service $service, array $payload, ?string $idempotencyKey = null): ServiceBooking
    {
        if ($idempotencyKey !== null && trim($idempotencyKey) !== '') {
            $existing = ServiceBooking::query()
                ->where('user_id', $user->id)
                ->where('idempotency_key', trim($idempotencyKey))
                ->with(['payment', 'providerAccount', 'service'])
                ->first();

            if ($existing !== null) {
                return $existing;
            }
        }

        $service = $this->resolveDirectBookableService($service);
        $provider = $service->providerAccount;

        if ($provider->user_id === $user->id) {
            throw new InvalidArgumentException(__('diyar.services.bookings.cannot_book_own_service'));
        }

        $activeBooking = app(ServiceBookingService::class)->findActiveForUserAndService($user, $service);

        if ($activeBooking !== null) {
            throw new ConflictHttpException(__('diyar.services.bookings.already_active_for_service'));
        }

        $scheduledDate = (string) ($payload['scheduled_date'] ?? '');
        $scheduledTime = (string) ($payload['scheduled_time'] ?? '');

        if ($scheduledDate === '' || $scheduledTime === '') {
            throw new InvalidArgumentException(__('diyar.services.bookings.schedule_required'));
        }

        $durationMinutes = $this->availability->defaultDurationMinutes($service->duration_minutes);

        try {
            return DB::transaction(function () use ($user, $service, $provider, $payload, $scheduledDate, $scheduledTime, $durationMinutes, $idempotencyKey) {
                $this->availability->assertSlotAvailable(
                    $provider,
                    $scheduledDate,
                    $scheduledTime,
                    $durationMinutes,
                );

                $booking = ServiceBooking::query()->create([
                    'service_offer_id' => null,
                    'service_request_id' => null,
                    'user_id' => $user->id,
                    'provider_account_id' => $provider->id,
                    'service_id' => $service->id,
                    'booking_source' => ServiceBookingSource::Direct,
                    'idempotency_key' => $idempotencyKey !== null && trim($idempotencyKey) !== '' ? trim($idempotencyKey) : null,
                    'service_title_snapshot' => $service->title,
                    'reference' => $this->allocateReference('SBK'),
                    'scheduled_date' => $scheduledDate,
                    'scheduled_time' => substr($scheduledTime, 0, 5),
                    'requested_scheduled_date' => $scheduledDate,
                    'requested_scheduled_time' => substr($scheduledTime, 0, 5),
                    'duration_minutes' => $durationMinutes,
                    'location' => isset($payload['location']) ? trim((string) $payload['location']) : $service->location,
                    'customer_notes' => isset($payload['customer_notes']) ? trim((string) $payload['customer_notes']) : null,
                    'price' => number_format((float) $service->starting_price, 2, '.', ''),
                    'currency' => $service->currency,
                    'payment_strategy' => ServicePaymentStrategy::Full,
                    'payment_status' => ServiceBookingPaymentStatus::Pending,
                    'status' => ServiceBookingStatus::PendingProviderConfirmation,
                ]);

                return $booking->fresh(['payment', 'providerAccount', 'service']);
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception) && $idempotencyKey !== null) {
                $existing = ServiceBooking::query()
                    ->where('user_id', $user->id)
                    ->where('idempotency_key', trim($idempotencyKey))
                    ->with(['payment', 'providerAccount', 'service'])
                    ->first();

                if ($existing !== null) {
                    return $existing;
                }
            }

            throw $exception;
        }
    }

    private function resolveDirectBookableService(Service $service): Service
    {
        $service = Service::query()
            ->with('providerAccount')
            ->whereKey($service->id)
            ->where('is_active', true)
            ->first();

        if ($service === null) {
            throw new InvalidArgumentException(__('diyar.services.catalog.not_available'));
        }

        if ($service->booking_mode !== ServiceBookingMode::Direct) {
            throw new InvalidArgumentException(__('diyar.services.bookings.direct_not_supported'));
        }

        if ($service->starting_price === null || (float) $service->starting_price <= 0) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_price'));
        }

        if ($service->providerAccount === null || $service->providerAccount->status !== ProviderAccountStatus::Active) {
            throw new InvalidArgumentException(__('diyar.services.provider_not_available'));
        }

        return $service;
    }

    private function allocateReference(string $prefix): string
    {
        $date = now()->format('Ymd');
        $count = ServiceBooking::query()->whereDate('created_at', today())->count() + 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $count);
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
