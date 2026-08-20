<?php

namespace App\Providers;

use App\Events\Domain\AffiliateCommissionAvailable;
use App\Events\Domain\AffiliatePayoutRequested;
use App\Events\Domain\OrderDelivered;
use App\Events\Domain\PaymentSucceeded;
use App\Events\Domain\ReturnUpdated;
use App\Listeners\Affiliate\ProcessAffiliateCommissionOnPaymentSucceeded;
use App\Listeners\Affiliate\ReleaseAffiliateCommissionOnVendorOrderDelivered;
use App\Listeners\Affiliate\ReverseAffiliateCommissionOnRefund;
use App\Listeners\Notifications\DispatchNotificationListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

final class AffiliateServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(PaymentSucceeded::class, ProcessAffiliateCommissionOnPaymentSucceeded::class);
        Event::listen(OrderDelivered::class, ReleaseAffiliateCommissionOnVendorOrderDelivered::class);
        Event::listen(ReturnUpdated::class, ReverseAffiliateCommissionOnRefund::class);

        Event::listen(AffiliateCommissionAvailable::class, DispatchNotificationListener::class);
        Event::listen(AffiliatePayoutRequested::class, DispatchNotificationListener::class);
    }
}
