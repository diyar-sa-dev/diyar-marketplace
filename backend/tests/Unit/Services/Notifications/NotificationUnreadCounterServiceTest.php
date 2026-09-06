<?php

namespace Tests\Unit\Services\Notifications;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationUnreadCounterService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class NotificationUnreadCounterServiceTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_increment_and_decrement_stay_non_negative(): void
    {
        Cache::flush();

        $user = $this->createUserWithRole(RoleName::Customer);
        $counters = app(NotificationUnreadCounterService::class);

        $this->assertSame(0, $counters->get($user));

        UserNotification::query()->create([
            'user_id' => $user->id,
            'type' => NotificationType::OrderCreated,
            'title' => 'Order',
            'body' => 'Body',
            'priority' => 'normal',
        ]);

        $this->assertSame(1, $counters->increment($user));
        $this->assertSame(1, $counters->get($user));

        $this->assertSame(0, $counters->decrement($user));
        $this->assertSame(0, $counters->decrement($user));
    }

    public function test_rebuild_restores_authoritative_count(): void
    {
        Cache::flush();

        $user = $this->createUserWithRole(RoleName::Customer);
        $counters = app(NotificationUnreadCounterService::class);

        foreach (range(1, 3) as $_) {
            UserNotification::query()->create([
                'user_id' => $user->id,
                'type' => NotificationType::OrderCreated,
                'title' => 'Order',
                'body' => 'Body',
                'priority' => 'normal',
            ]);
        }

        Cache::put($counters->keyForUser($user->id), 99, 300);

        $this->assertSame(3, $counters->rebuild($user));
        $this->assertSame(3, $counters->get($user));
    }

    public function test_mark_all_read_zeros_counter(): void
    {
        Cache::flush();

        $user = $this->createUserWithRole(RoleName::Customer);
        $counters = app(NotificationUnreadCounterService::class);

        $counters->increment($user, 5);
        $counters->markAllRead($user);

        $this->assertSame(0, $counters->get($user));
    }
}
