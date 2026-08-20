<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationDispatcher;
use App\Services\Notifications\NotificationPreferenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationPreferenceApiTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_user_can_read_and_update_notification_preferences(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser('/api/v1/profile/notification-preferences', $user)
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'channels' => ['email', 'push', 'sms'],
                    'categories' => [
                        ['key', 'label', 'policy', 'channels', 'channel_policies'],
                    ],
                    'preferences',
                    'category_enabled',
                ],
            ])
            ->assertJsonPath('data.preferences.orders.in_app', true)
            ->assertJsonPath('data.channels.sms.available', false);

        $this->patchJsonAsUser('/api/v1/profile/notification-preferences', $user, [
            'channels' => [
                'email' => false,
                'push' => true,
            ],
            'preferences' => [
                'orders' => [
                    'email' => false,
                    'push' => false,
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.preferences.orders.email', false)
            ->assertJsonPath('data.preferences.orders.in_app', true)
            ->assertJsonPath('data.channels.email', false);

        $fresh = $user->fresh();
        $preferences = is_array($fresh->preferences) ? $fresh->preferences : [];
        $notifications = is_array($preferences['notifications'] ?? null) ? $preferences['notifications'] : [];
        $this->assertFalse((bool) ($notifications['email'] ?? true));
    }

    public function test_required_in_app_preferences_cannot_be_disabled(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $this->patchJsonAsUser('/api/v1/profile/notification-preferences', $user, [
            'category_enabled' => [
                'system' => false,
            ],
            'preferences' => [
                'system' => [
                    'in_app' => false,
                ],
            ],
        ])->assertOk();

        $matrix = app(NotificationPreferenceService::class)->matrixFor($user->fresh());
        $this->assertTrue($matrix['system']['in_app']);
    }

    public function test_global_email_off_blocks_email_delivery(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $this->patchJsonAsUser('/api/v1/profile/notification-preferences', $user, [
            'channels' => ['email' => false],
        ])->assertOk();

        app(NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$user->fresh()],
            ['order_number' => 'DYR-EMAIL-OFF', 'total' => '99.00'],
            'order',
            'order-email-off',
            'stage16.test:order-email-off',
        );

        $notification = UserNotification::query()->where('user_id', $user->id)->firstOrFail();

        $this->assertDatabaseMissing('notification_deliveries', [
            'user_notification_id' => $notification->id,
            'channel' => 'email',
        ]);
    }
}
