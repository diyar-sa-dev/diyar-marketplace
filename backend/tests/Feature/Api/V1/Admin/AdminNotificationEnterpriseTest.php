<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\NotificationBroadcastAudience;
use App\Enums\NotificationBroadcastStatus;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationPriority;
use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Jobs\Notifications\ProcessNotificationBroadcastJob;
use App\Models\NotificationBroadcast;
use App\Models\NotificationDelivery;
use App\Models\Permission;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationBroadcastService;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminNotificationEnterpriseTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_admin_can_create_broadcast_campaign(): void
    {
        Queue::fake([ProcessNotificationBroadcastJob::class]);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $this->createUserWithRole(RoleName::Customer);
        $this->createUserWithRole(RoleName::Customer);

        $response = $this->postJsonAsAdmin('/api/v1/admin/notifications/broadcasts', $admin, [
            'title' => 'Platform maintenance',
            'body' => 'Scheduled maintenance tonight.',
            'category' => 'system',
            'channels' => ['in_app'],
            'audience_type' => NotificationBroadcastAudience::Customer->value,
            'priority' => 'low',
        ])->assertCreated();

        $broadcastId = (string) $response->json('data.broadcast.id');
        $this->assertNotEmpty($broadcastId);

        $broadcast = NotificationBroadcast::query()->findOrFail($broadcastId);
        $this->assertSame(2, $broadcast->total_recipients);

        Queue::assertPushed(ProcessNotificationBroadcastJob::class);
    }

    public function test_broadcast_job_dispatches_idempotent_notifications(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);

        $broadcast = NotificationBroadcast::query()->create([
            'created_by' => $admin->id,
            'title' => 'Hello',
            'body' => 'World',
            'category' => 'system',
            'channels' => ['in_app'],
            'audience_type' => NotificationBroadcastAudience::SelectedUsers,
            'audience_filter' => ['user_ids' => [(string) $customer->id]],
            'priority' => NotificationPriority::Low,
            'status' => NotificationBroadcastStatus::Pending,
            'total_recipients' => 1,
        ]);

        (new ProcessNotificationBroadcastJob($broadcast->id))->handle(
            app(NotificationBroadcastService::class),
            app(NotificationDispatcher::class),
        );

        $this->assertSame(1, UserNotification::query()->where('user_id', $customer->id)->count());
        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $customer->id,
            'type' => NotificationType::SystemAlert->value,
        ]);

        (new ProcessNotificationBroadcastJob($broadcast->id))->handle(
            app(NotificationBroadcastService::class),
            app(NotificationDispatcher::class),
        );

        $this->assertSame(1, UserNotification::query()->where('user_id', $customer->id)->count());
    }

    public function test_admin_can_list_and_retry_failed_deliveries(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$customer],
            ['order_number' => 'DYR-1', 'total' => '100.00'],
            'order',
            'order-1',
            'order.created:order-1',
        );

        $delivery = NotificationDelivery::query()->firstOrFail();
        $delivery->update([
            'status' => NotificationDeliveryStatus::Failed,
            'last_error' => 'SMTP timeout',
        ]);

        Bus::fake([DeliverNotificationChannelJob::class]);

        $this->getJsonAsAdmin('/api/v1/admin/notifications/deliveries?status=failed', $admin)
            ->assertOk()
            ->assertJsonPath('data.deliveries.0.id', $delivery->id);

        $this->postJsonAsAdmin("/api/v1/admin/notifications/deliveries/{$delivery->id}/retry", $admin)
            ->assertOk()
            ->assertJsonPath('data.delivery.status', NotificationDeliveryStatus::Queued->value);

        Bus::assertDispatched(DeliverNotificationChannelJob::class);
    }

    public function test_notification_show_includes_deliveries(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$customer],
            ['order_number' => 'DYR-2', 'total' => '50.00'],
            'order',
            'order-2',
            'order.created:order-2',
        );

        $notification = UserNotification::query()->firstOrFail();

        $this->getJsonAsAdmin("/api/v1/admin/notifications/{$notification->id}", $admin)
            ->assertOk()
            ->assertJsonPath('data.notification.id', $notification->id);

        $this->assertNotEmpty($this->getJsonAsAdmin("/api/v1/admin/notifications/{$notification->id}", $admin)->json('data.deliveries'));
    }

    public function test_view_only_admin_cannot_create_broadcast(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $permission = Permission::query()->where('key', 'notifications.manage')->firstOrFail();
        $admin->roles()->first()?->permissions()->detach($permission->id);

        $this->postJsonAsAdmin('/api/v1/admin/notifications/broadcasts', $admin, [
            'title' => 'Blocked',
            'body' => 'Should fail',
            'channels' => ['in_app'],
            'audience_type' => NotificationBroadcastAudience::All->value,
        ])->assertForbidden();
    }
}
