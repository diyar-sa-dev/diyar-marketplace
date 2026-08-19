<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceBookingPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class ServiceBookingPaymentService
{
    /**
     * @return array{payment: ServiceBookingPayment, booking: ServiceBooking}
     */
    public function initiate(User $user, ServiceBooking $booking): array
    {
        if ($booking->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($booking->status !== ServiceBookingStatus::PendingPayment) {
            throw new InvalidArgumentException(__('diyar.services.payments.not_payable'));
        }

        $payment = $booking->payment()->firstOrCreate(
            ['service_booking_id' => $booking->id],
            [
                'status' => ServiceBookingPaymentStatus::Pending,
                'amount' => $booking->price,
                'currency' => $booking->currency,
                'gateway' => config('payments.default_gateway', 'local'),
            ],
        );

        return [
            'payment' => $payment->fresh(),
            'booking' => $booking->fresh(['payment', 'providerAccount']),
        ];
    }

    public function simulate(User $user, ServiceBooking $booking, string $outcome): ServiceBooking
    {
        if ($booking->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return DB::transaction(function () use ($user, $booking, $outcome) {
            $lockedBooking = ServiceBooking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedBooking->user_id !== $user->id) {
                throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
            }

            $payment = ServiceBookingPayment::query()
                ->where('service_booking_id', $lockedBooking->id)
                ->lockForUpdate()
                ->first();

            if ($payment === null) {
                throw new InvalidArgumentException(__('diyar.services.payments.not_initialized'));
            }

            if ($outcome === 'paid') {
                if ($lockedBooking->status === ServiceBookingStatus::Confirmed
                    && $payment->status === ServiceBookingPaymentStatus::Paid) {
                    return $lockedBooking->fresh(['payment', 'providerAccount', 'serviceRequest']);
                }

                if ($lockedBooking->status !== ServiceBookingStatus::PendingPayment) {
                    throw new InvalidArgumentException(__('diyar.services.payments.not_payable'));
                }

                $payment->update([
                    'status' => ServiceBookingPaymentStatus::Paid,
                    'payment_method' => 'local_simulator',
                    'payment_reference' => $lockedBooking->reference,
                    'paid_at' => now(),
                    'failed_at' => null,
                    'failure_reason' => null,
                ]);

                $lockedBooking->update([
                    'payment_status' => ServiceBookingPaymentStatus::Paid,
                    'status' => ServiceBookingStatus::Confirmed,
                ]);

                $lockedBooking->serviceRequest?->update(['status' => ServiceRequestStatus::InProgress]);

                Log::info('service_booking.payment.simulated_paid', [
                    'booking_id' => $lockedBooking->id,
                    'payment_id' => $payment->id,
                    'user_id' => $user->id,
                ]);

                return $lockedBooking->fresh(['payment', 'providerAccount', 'serviceRequest']);
            }

            if ($lockedBooking->status !== ServiceBookingStatus::PendingPayment) {
                throw new InvalidArgumentException(__('diyar.services.payments.not_payable'));
            }

            $payment->update([
                'status' => ServiceBookingPaymentStatus::Failed,
                'failed_at' => now(),
                'failure_reason' => __('diyar.services.payments.simulation_failed'),
            ]);

            Log::info('service_booking.payment.simulated_failed', [
                'booking_id' => $lockedBooking->id,
                'payment_id' => $payment->id,
                'user_id' => $user->id,
            ]);

            return $lockedBooking->fresh(['payment', 'providerAccount', 'serviceRequest']);
        });
    }
}
