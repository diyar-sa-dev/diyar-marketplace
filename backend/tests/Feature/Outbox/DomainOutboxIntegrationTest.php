<?php

namespace Tests\Feature\Outbox;

use App\Enums\DomainOutboxEventStatus;
use App\Enums\NotificationChannel;
use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\DomainOutboxEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class DomainOutboxIntegrationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('diyar.outbox.enabled', true);
    }

    public function test_notification_dispatch_creates_outbox_event_and_processor_dispatches_job(): void
    {
        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);

        app(\App\Services\Notifications\NotificationDispatcher::class)->dispatch(
            NotificationType::OrderCreated,
            [$user],
            ['order_number' => 'DYR-900', 'total' => '10.00'],
            'order',
            'order-900',
            'order.created:order-900',
        );

        $this->assertSame(1, DomainOutboxEvent::query()->count());
        $event = DomainOutboxEvent::query()->firstOrFail();
        $this->assertSame(DomainOutboxEventStatus::Pending, $event->status);
        $this->assertSame('notification.delivery.dispatch', $event->event_type);

        Artisan::call('outbox:process');

        $event->refresh();
        $this->assertSame(DomainOutboxEventStatus::Processed, $event->status);

        Queue::assertPushed(DeliverNotificationChannelJob::class);
    }

    public function test_outbox_idempotency_prevents_duplicate_events(): void
    {
        $publisher = app(\App\Services\Outbox\DomainOutboxPublisher::class);

        $first = $publisher->publish(
            'notification.delivery.dispatch',
            'notification_delivery',
            (string) str()->uuid(),
            ['delivery_id' => 'abc'],
            'same-key',
        );

        $second = $publisher->publish(
            'notification.delivery.dispatch',
            'notification_delivery',
            (string) str()->uuid(),
            ['delivery_id' => 'def'],
            'same-key',
        );

        $this->assertNotNull($first);
        $this->assertNotNull($second);
        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, DomainOutboxEvent::query()->count());
    }
}
