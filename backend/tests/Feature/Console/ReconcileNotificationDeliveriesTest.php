<?php

namespace Tests\Feature\Console;

use App\Enums\NotificationChannel;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationPriority;
use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\NotificationDelivery;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ReconcileNotificationDeliveriesTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_reconcile_redispatches_due_retrying_deliveries(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $notification = UserNotification::query()->create([
            'user_id' => $user->id,
            'type' => NotificationType::OrderCreated,
            'title' => 'Order',
            'body' => 'Body',
            'priority' => NotificationPriority::Normal,
        ]);

        $delivery = NotificationDelivery::query()->create([
            'user_notification_id' => $notification->id,
            'user_id' => $user->id,
            'channel' => NotificationChannel::Email,
            'status' => NotificationDeliveryStatus::Retrying,
            'dedupe_key' => 'retry:test:email',
            'next_retry_at' => now()->subMinute(),
            'attempts' => 2,
        ]);

        Artisan::call('notifications:reconcile-deliveries');

        Queue::assertPushed(DeliverNotificationChannelJob::class, function (DeliverNotificationChannelJob $job) use ($delivery) {
            return $job->deliveryId === $delivery->id;
        });
    }

    public function test_reconcile_recovers_expired_processing_lease_and_redispatches(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $notification = UserNotification::query()->create([
            'user_id' => $user->id,
            'type' => NotificationType::OrderCreated,
            'title' => 'Order',
            'body' => 'Body',
            'priority' => NotificationPriority::High,
        ]);

        $delivery = NotificationDelivery::query()->create([
            'user_notification_id' => $notification->id,
            'user_id' => $user->id,
            'channel' => NotificationChannel::Email,
            'status' => NotificationDeliveryStatus::Processing,
            'dedupe_key' => 'lease:test:email',
            'attempts' => 1,
            'last_attempt_at' => now()->subHour(),
            'processing_lease_until' => now()->subMinute(),
        ]);

        Artisan::call('notifications:reconcile-deliveries');

        $delivery->refresh();
        $this->assertSame(NotificationDeliveryStatus::Retrying, $delivery->status);

        Queue::assertPushed(DeliverNotificationChannelJob::class, function (DeliverNotificationChannelJob $job) use ($delivery) {
            return $job->deliveryId === $delivery->id;
        });
    }
}
