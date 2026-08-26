<?php

namespace App\Listeners\Analytics;

use App\Events\Domain\BookingCompleted;
use App\Events\Domain\BookingCreated;
use App\Events\Domain\OrderCreated;
use App\Events\Domain\PaymentFailed;
use App\Events\Domain\PaymentSucceeded;
use App\Services\Analytics\AnalyticsCacheInvalidator;

final class InvalidateAnalyticsCacheListener
{
    public function __construct(
        private readonly AnalyticsCacheInvalidator $invalidator,
    ) {}

    public function handlePaymentSucceeded(PaymentSucceeded $event): void
    {
        $this->invalidator->invalidateForPayment($event->payment);
    }

    public function handlePaymentFailed(PaymentFailed $event): void
    {
        $this->invalidator->invalidateForPayment($event->payment);
    }

    public function handleOrderCreated(OrderCreated $event): void
    {
        $this->invalidator->invalidateForOrder($event->order);
    }

    public function handleBookingCreated(BookingCreated $event): void
    {
        $this->invalidator->invalidateForBooking($event->booking);
    }

    public function handleBookingCompleted(BookingCompleted $event): void
    {
        $this->invalidator->invalidateForBooking($event->booking);
    }
}
