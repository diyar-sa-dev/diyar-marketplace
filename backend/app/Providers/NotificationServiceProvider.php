<?php

namespace App\Providers;

use App\Contracts\Notifications\PushProviderInterface;
use App\Events\Domain\B2bCompanyPublished;
use App\Events\Domain\B2bLeadAccepted;
use App\Events\Domain\B2bLeadReceived;
use App\Events\Domain\B2bLeadRejected;
use App\Events\Domain\BookingCompleted;
use App\Events\Domain\BookingCreated;
use App\Events\Domain\CouponActivated;
use App\Events\Domain\CouponDeactivated;
use App\Events\Domain\MessageCreated;
use App\Events\Domain\OrderCreated;
use App\Events\Domain\OrderDelivered;
use App\Events\Domain\OrderShipped;
use App\Events\Domain\PaymentFailed;
use App\Events\Domain\PaymentSucceeded;
use App\Events\Domain\ProductStockLow;
use App\Events\Domain\ReturnUpdated;
use App\Events\Domain\ReviewCreated;
use App\Events\Domain\ServiceOfferAccepted;
use App\Events\Domain\ServiceOfferReceived;
use App\Events\Domain\TeamInvitationReceived;
use App\Events\Domain\TeamMemberAdded;
use App\Events\Domain\VendorOrderReceived;
use App\Infrastructure\Notifications\CompositePushProvider;
use App\Listeners\Notifications\DispatchNotificationListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

final class NotificationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PushProviderInterface::class, CompositePushProvider::class);
    }

    public function boot(): void
    {
        $events = [
            OrderCreated::class,
            VendorOrderReceived::class,
            PaymentSucceeded::class,
            PaymentFailed::class,
            OrderShipped::class,
            OrderDelivered::class,
            ReturnUpdated::class,
            ServiceOfferReceived::class,
            ServiceOfferAccepted::class,
            BookingCreated::class,
            BookingCompleted::class,
            ReviewCreated::class,
            CouponActivated::class,
            CouponDeactivated::class,
            TeamInvitationReceived::class,
            TeamMemberAdded::class,
            ProductStockLow::class,
            MessageCreated::class,
            B2bCompanyPublished::class,
            B2bLeadReceived::class,
            B2bLeadAccepted::class,
            B2bLeadRejected::class,
        ];

        foreach ($events as $eventClass) {
            Event::listen($eventClass, DispatchNotificationListener::class);
        }
    }
}
