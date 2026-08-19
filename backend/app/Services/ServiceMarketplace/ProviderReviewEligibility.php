<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\ServiceBooking;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ProviderReviewEligibility
{
    public function canReview(User $user, ServiceBooking $booking): bool
    {
        if ($booking->user_id !== $user->id) {
            return false;
        }

        if ($booking->status !== ServiceBookingStatus::Completed) {
            return false;
        }

        if ($booking->payment_status !== ServiceBookingPaymentStatus::Paid) {
            return false;
        }

        return ! $booking->providerReview()->exists();
    }

    public function assertCanReview(User $user, ServiceBooking $booking): void
    {
        if ($booking->user_id !== $user->id) {
            throw new \InvalidArgumentException(__('diyar.provider_review.booking_not_owned'));
        }

        if ($booking->status !== ServiceBookingStatus::Completed) {
            throw new \InvalidArgumentException(__('diyar.provider_review.not_eligible'));
        }

        if ($booking->payment_status !== ServiceBookingPaymentStatus::Paid) {
            throw new \InvalidArgumentException(__('diyar.provider_review.not_eligible'));
        }

        if ($booking->providerReview()->exists()) {
            throw new ConflictHttpException(
                __('diyar.provider_review.already_reviewed'),
            );
        }
    }
}
