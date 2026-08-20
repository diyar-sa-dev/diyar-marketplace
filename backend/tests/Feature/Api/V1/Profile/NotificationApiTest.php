<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_user_can_list_mark_read_and_delete_notifications(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$user],
            ['order_number' => 'DYR-1', 'total' => '100.00', 'action_url' => '/orders/1'],
            'order',
            'order-1',
            'order.created:order-1',
        );

        $notification = UserNotification::query()->where('user_id', $user->id)->firstOrFail();

        $this->getJsonAsUser('/api/v1/profile/notifications/unread-count', $user)
            ->assertOk()
            ->assertJsonPath('data.unread_count', 1);

        $this->getJsonAsUser('/api/v1/profile/notifications', $user)
            ->assertOk()
            ->assertJsonPath('data.notifications.0.id', $notification->id)
            ->assertJsonPath('data.notifications.0.is_read', false);

        $this->patchJsonAsUser("/api/v1/profile/notifications/{$notification->id}/read", $user)
            ->assertOk()
            ->assertJsonPath('data.notification.is_read', true);

        $this->getJsonAsUser('/api/v1/profile/notifications/unread-count', $user)
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);

        $this->patchJsonAsUser('/api/v1/profile/notifications/read-all', $user)
            ->assertOk();

        $this->deleteJsonAsUser("/api/v1/profile/notifications/{$notification->id}", $user)
            ->assertOk();

        $this->patchJsonAsUser("/api/v1/profile/notifications/{$notification->id}/read", $other)
            ->assertNotFound();
    }

    public function test_duplicate_domain_event_does_not_create_duplicate_notification(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $dispatcher = app(NotificationDispatcher::class);

        foreach (range(1, 2) as $_) {
            $dispatcher->dispatch(
                NotificationType::PaymentSuccess,
                [$user],
                ['order_number' => 'DYR-2', 'amount' => '50.00', 'action_url' => '/orders/2'],
                'payment',
                'pay-1',
                'payment.success:pay-1',
            );
        }

        $this->assertSame(1, UserNotification::query()->where('user_id', $user->id)->count());
    }

    public function test_user_can_filter_notifications_by_status_and_category(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $dispatcher = app(NotificationDispatcher::class);

        $dispatcher->dispatch(
            NotificationType::OrderCreated,
            [$user],
            ['order_number' => 'DYR-A', 'total' => '10.00'],
            'order',
            'order-a',
            'order.created:order-a',
        );

        $dispatcher->dispatch(
            NotificationType::PaymentSuccess,
            [$user],
            ['order_number' => 'DYR-B', 'amount' => '20.00'],
            'payment',
            'pay-b',
            'payment.success:pay-b',
        );

        $this->getJsonAsUser('/api/v1/profile/notifications?status=unread', $user)
            ->assertOk()
            ->assertJsonCount(2, 'data.notifications');

        $this->getJsonAsUser('/api/v1/profile/notifications?category=orders', $user)
            ->assertOk()
            ->assertJsonCount(1, 'data.notifications')
            ->assertJsonPath('data.notifications.0.type', NotificationType::OrderCreated->value);

        $this->getJsonAsUser('/api/v1/profile/notifications?category=follows', $user)
            ->assertOk()
            ->assertJsonCount(0, 'data.notifications');
    }
}
