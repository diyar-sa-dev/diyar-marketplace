<?php

namespace Tests\Feature\Notifications;

use App\Channels\Notifications\EmailNotificationChannel;
use App\Channels\Notifications\InAppChannel;
use App\Channels\Notifications\PushNotificationChannel;
use App\Contracts\Notifications\PushProviderInterface;
use App\Enums\NotificationChannel;
use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Infrastructure\Notifications\PushSendResult;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\NotificationDelivery;
use App\Models\NotificationDevice;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationPushDeliveryTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_invalid_push_tokens_are_deactivated(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $notification = UserNotification::query()->create([
            'user_id' => $user->id,
            'type' => NotificationType::OrderCreated,
            'title' => 'Test',
            'body' => 'Body',
            'priority' => 'normal',
        ]);

        $device = NotificationDevice::query()->create([
            'user_id' => $user->id,
            'token' => 'invalid-token',
            'platform' => 'android',
            'active' => true,
        ]);

        $delivery = NotificationDelivery::query()->create([
            'user_notification_id' => $notification->id,
            'user_id' => $user->id,
            'channel' => NotificationChannel::Push,
            'status' => 'pending',
            'dedupe_key' => 'push:test:'.$device->id,
        ]);

        $mock = Mockery::mock(PushProviderInterface::class);
        $mock->shouldReceive('send')
            ->once()
            ->andReturn(new PushSendResult(invalidDeviceIds: [$device->id]));
        $this->app->instance(PushProviderInterface::class, $mock);

        $job = new DeliverNotificationChannelJob($delivery->id);
        $job->handle(
            app(InAppChannel::class),
            app(EmailNotificationChannel::class),
            app(PushNotificationChannel::class),
        );

        $this->assertFalse($device->fresh()->active);
    }

    public function test_high_priority_notifications_use_high_queue(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::PaymentFailed,
            [$user],
            ['order_number' => 'DYR-1', 'amount' => '10.00'],
            'payment',
            'pay-1',
            'payment.failed:pay-1',
        );

        Queue::assertPushed(DeliverNotificationChannelJob::class, function (DeliverNotificationChannelJob $job) {
            return $job->queue === 'notifications-high';
        });
    }
}
