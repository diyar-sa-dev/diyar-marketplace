<?php

namespace App\Providers;

use App\Events\Domain\PaymentSucceeded;
use App\Events\Domain\ReturnUpdated;
use App\Listeners\Loyalty\AccrueLoyaltyOnPaymentSucceeded;
use App\Listeners\Loyalty\ReverseLoyaltyOnRefund;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

final class LoyaltyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(PaymentSucceeded::class, AccrueLoyaltyOnPaymentSucceeded::class);
        Event::listen(ReturnUpdated::class, ReverseLoyaltyOnRefund::class);
    }
}
