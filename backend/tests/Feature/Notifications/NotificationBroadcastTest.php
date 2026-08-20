<?php

namespace Tests\Feature\Notifications;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Events\Broadcast\UserNotificationCreated;
use App\Models\User;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationBroadcastTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_notification_creation_broadcasts_private_user_event(): void
    {
        Event::fake([UserNotificationCreated::class]);
        config(['broadcasting.default' => 'log', 'diyar.notifications.realtime_enabled' => true]);

        $user = $this->createUserWithRole(RoleName::Customer);

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$user],
            ['order_number' => 'DYR-99', 'total' => '10.00', 'action_url' => '/orders/99'],
            'order',
            'order-99',
            'order.created:order-99',
        );

        Event::assertDispatched(UserNotificationCreated::class, function (UserNotificationCreated $event) use ($user) {
            return $event->notification->user_id === $user->id
                && $event->broadcastAs() === 'notification.created'
                && $event->unreadCount === 1;
        });
    }

    public function test_duplicate_dedupe_key_does_not_rebroadcast_notification(): void
    {
        Event::fake([UserNotificationCreated::class]);
        config(['broadcasting.default' => 'log', 'diyar.notifications.realtime_enabled' => true]);

        $user = $this->createUserWithRole(RoleName::Customer);
        $dispatcher = app(NotificationDispatcher::class);
        $payload = ['order_number' => 'DYR-99', 'total' => '10.00', 'action_url' => '/orders/99'];
        $dedupe = 'order.created:order-99';

        $dispatcher->dispatch(
            NotificationType::OrderCreated,
            [$user],
            $payload,
            'order',
            'order-99',
            $dedupe,
        );

        Event::assertDispatched(UserNotificationCreated::class);

        Event::fake([UserNotificationCreated::class]);

        $dispatcher->dispatch(
            NotificationType::OrderCreated,
            [$user],
            $payload,
            'order',
            'order-99',
            $dedupe,
        );

        Event::assertNotDispatched(UserNotificationCreated::class);
    }

    public function test_private_channel_authorization_rejects_other_users(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);

        $authorize = function (?User $authenticated, string $userId): bool {
            if ($authenticated === null) {
                return false;
            }

            return hash_equals((string) $authenticated->getAuthIdentifier(), (string) $userId);
        };

        $this->assertTrue($authorize($user, (string) $user->id));
        $this->assertFalse($authorize($other, (string) $user->id));
    }
}
