<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingStatus;
use App\Enums\Weekday;
use App\Models\ProviderAccount;
use App\Models\ServiceBooking;
use Carbon\Carbon;
use InvalidArgumentException;

final class ProviderAvailabilityService
{
    public function assertMinimumLeadTime(string $scheduledDate, string $scheduledTime, ?int $leadHours = null): void
    {
        $hours = $leadHours ?? (int) config('diyar.services.booking_min_lead_hours', 2);
        $slot = $this->resolveSlotStart($scheduledDate, $scheduledTime);
        $minimum = now()->addHours(max(0, $hours));

        if ($slot->lt($minimum)) {
            throw new InvalidArgumentException(__('diyar.services.bookings.schedule_too_soon'));
        }
    }

    public function defaultDurationMinutes(?int $serviceDurationMinutes): int
    {
        $configured = (int) config('diyar.services.default_booking_duration_minutes', 60);

        return $serviceDurationMinutes !== null && $serviceDurationMinutes > 0
            ? $serviceDurationMinutes
            : max(15, $configured);
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $workingHours
     */
    public function assertSlotAvailable(
        ProviderAccount $provider,
        string $scheduledDate,
        string $scheduledTime,
        int $durationMinutes,
        ?array $workingHours = null,
        ?string $ignoreBookingId = null,
    ): void {
        $hours = $workingHours ?? $provider->working_hours ?? [];
        $start = $this->resolveSlotStart($scheduledDate, $scheduledTime);
        $end = $start->copy()->addMinutes($durationMinutes);

        $this->assertWithinWorkingHours($start, $end, $hours);
        $this->assertNoConflicts($provider->id, $start, $end, $ignoreBookingId);
    }

    /**
     * @param  array<int, array<string, mixed>>  $workingHours
     */
    private function assertWithinWorkingHours(Carbon $start, Carbon $end, array $workingHours): void
    {
        if ($workingHours === []) {
            return;
        }

        $dayKey = strtolower($start->format('l'));
        $weekday = Weekday::tryFrom($dayKey);

        if ($weekday === null) {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_schedule'));
        }

        $entry = collect($workingHours)->firstWhere('day', $weekday->value);

        if ($entry === null || (bool) ($entry['is_closed'] ?? false)) {
            throw new InvalidArgumentException(__('diyar.services.bookings.provider_closed'));
        }

        $opensAt = (string) ($entry['opens_at'] ?? '');
        $closesAt = (string) ($entry['closes_at'] ?? '');

        if ($opensAt === '' || $closesAt === '') {
            throw new InvalidArgumentException(__('diyar.services.bookings.invalid_schedule'));
        }

        $open = $start->copy()->setTimeFromTimeString(substr($opensAt, 0, 5));
        $close = $start->copy()->setTimeFromTimeString(substr($closesAt, 0, 5));

        if ($start->lt($open) || $end->gt($close)) {
            throw new InvalidArgumentException(__('diyar.services.bookings.outside_working_hours'));
        }
    }

    private function assertNoConflicts(string $providerAccountId, Carbon $start, Carbon $end, ?string $ignoreBookingId): void
    {
        $date = $start->toDateString();

        $bookings = ServiceBooking::query()
            ->where('provider_account_id', $providerAccountId)
            ->whereDate('scheduled_date', $date)
            ->whereIn('status', [
                ServiceBookingStatus::PendingProviderConfirmation,
                ServiceBookingStatus::PendingCustomerAcceptance,
                ServiceBookingStatus::PendingPayment,
                ServiceBookingStatus::Confirmed,
                ServiceBookingStatus::InProgress,
            ])
            ->when($ignoreBookingId !== null, fn ($query) => $query->whereKeyNot($ignoreBookingId))
            ->lockForUpdate()
            ->get(['id', 'scheduled_time', 'duration_minutes', 'status', 'payment_status']);

        foreach ($bookings as $booking) {
            if ($booking->scheduled_time === null) {
                continue;
            }

            $existingStart = $this->resolveSlotStart($date, (string) $booking->scheduled_time);
            $existingDuration = $this->defaultDurationMinutes($booking->duration_minutes);
            $existingEnd = $existingStart->copy()->addMinutes($existingDuration);

            if ($start->lt($existingEnd) && $end->gt($existingStart)) {
                throw new InvalidArgumentException(__('diyar.services.bookings.slot_unavailable'));
            }
        }
    }

    private function resolveSlotStart(string $date, string $time): Carbon
    {
        $normalizedTime = substr(trim($time), 0, 5);

        return Carbon::parse("{$date} {$normalizedTime}", config('app.timezone'));
    }
}
