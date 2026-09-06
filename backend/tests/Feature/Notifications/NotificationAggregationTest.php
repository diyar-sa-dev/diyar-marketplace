<?php

namespace Tests\Feature\Notifications;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationAggregationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_review_notifications_aggregate_within_window(): void
    {
        Queue::fake();

        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $dispatcher = app(NotificationDispatcher::class);

        $payloadBase = [
            'product_name' => 'Chair',
            'rating' => 5,
            'store_name' => 'Home Store',
            'action_url' => '/products/chair',
        ];

        foreach (['Ahmed', 'Karim', 'Yacine'] as $index => $reviewer) {
            $dispatcher->dispatch(
                NotificationType::ReviewCreated,
                [$vendor],
                array_merge($payloadBase, ['reviewer_name' => $reviewer]),
                'product',
                'prod-1',
                "review.created:prod-1:{$index}",
            );
        }

        $this->assertSame(1, UserNotification::query()->where('user_id', $vendor->id)->count());

        $notification = UserNotification::query()->where('user_id', $vendor->id)->firstOrFail();
        $this->assertSame(3, $notification->aggregated_count);
        $this->assertNotNull($notification->group_key);
        $this->assertStringContainsString('Yacine', $notification->title);
        $this->assertStringContainsString('2 others', $notification->title);
    }

    public function test_payment_notifications_are_never_aggregated(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $dispatcher = app(NotificationDispatcher::class);

        foreach (range(1, 2) as $index) {
            $dispatcher->dispatch(
                NotificationType::PaymentFailed,
                [$user],
                ['order_number' => "DYR-{$index}"],
                'payment',
                "pay-{$index}",
                "payment.failed:pay-{$index}",
            );
        }

        $this->assertSame(2, UserNotification::query()->where('user_id', $user->id)->count());
    }
}
