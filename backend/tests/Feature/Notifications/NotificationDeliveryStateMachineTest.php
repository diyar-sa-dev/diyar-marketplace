<?php

namespace Tests\Feature\Notifications;

use App\Enums\NotificationChannel;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\NotificationDelivery;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDeliveryStateMachine;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\AssertsQueryCount;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationDeliveryStateMachineTest extends TestCase
{
    use AssertsQueryCount;
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_dispatcher_creates_queued_deliveries(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$user],
            ['order_number' => 'DYR-77', 'total' => '50.00'],
            'order',
            'order-77',
            'order.created:order-77',
        );

        $delivery = NotificationDelivery::query()->where('channel', NotificationChannel::Email)->first();

        $this->assertNotNull($delivery);
        $this->assertSame(NotificationDeliveryStatus::Queued, $delivery->status);
        $this->assertNotEmpty($delivery->correlation_id);
    }

    public function test_state_machine_marks_delivered_from_processing(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $notification = UserNotification::query()->create([
            'user_id' => $user->id,
            'type' => NotificationType::OrderCreated,
            'title' => 'Test',
            'body' => 'Body',
            'priority' => 'normal',
        ]);

        $delivery = NotificationDelivery::query()->create([
            'user_notification_id' => $notification->id,
            'user_id' => $user->id,
            'channel' => NotificationChannel::Email,
            'status' => NotificationDeliveryStatus::Processing,
            'dedupe_key' => 'test:email:1',
            'attempts' => 1,
        ]);

        $stateMachine = app(NotificationDeliveryStateMachine::class);
        $updated = $stateMachine->markDelivered($delivery, provider: 'email');

        $this->assertSame(NotificationDeliveryStatus::Delivered, $updated->status);
        $this->assertNotNull($updated->delivered_at);
    }

    public function test_admin_notification_list_respects_query_budget(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);

        for ($i = 0; $i < 5; $i++) {
            UserNotification::query()->create([
                'user_id' => $customer->id,
                'type' => NotificationType::OrderCreated,
                'title' => "Order {$i}",
                'body' => 'Body',
                'priority' => 'normal',
            ]);
        }

        $this->assertQueryCountAtMost(
            fn () => $this->getJsonAsAdmin('/api/v1/admin/notifications?per_page=20', $admin)->assertOk(),
            12,
            'Admin notification index should not N+1.',
        );
    }
}
