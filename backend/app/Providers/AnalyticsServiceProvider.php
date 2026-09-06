<?php

namespace App\Providers;

use App\Events\Domain\BookingCompleted;
use App\Events\Domain\BookingCreated;
use App\Events\Domain\OrderCreated;
use App\Events\Domain\PaymentFailed;
use App\Events\Domain\PaymentSucceeded;
use App\Listeners\Analytics\InvalidateAnalyticsCacheListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

final class AnalyticsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $listener = InvalidateAnalyticsCacheListener::class;

        Event::listen(PaymentSucceeded::class, [$listener, 'handlePaymentSucceeded']);
        Event::listen(PaymentFailed::class, [$listener, 'handlePaymentFailed']);
        Event::listen(OrderCreated::class, [$listener, 'handleOrderCreated']);
        Event::listen(BookingCreated::class, [$listener, 'handleBookingCreated']);
        Event::listen(BookingCompleted::class, [$listener, 'handleBookingCompleted']);
    }
}
