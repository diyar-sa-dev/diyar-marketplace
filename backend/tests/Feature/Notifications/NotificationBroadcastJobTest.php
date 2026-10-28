<?php

declare(strict_types=1);

namespace Tests\Feature\Notifications;

use App\Domains\Notifications\Jobs\ProcessNotificationBroadcastJob;
use App\Domains\Notifications\Services\NotificationBroadcastService;
use App\Domains\Notifications\Services\NotificationDispatcher;
use App\Enums\NotificationBroadcastAudience;
use App\Enums\NotificationBroadcastStatus;
use App\Enums\NotificationPriority;
use App\Models\NotificationBroadcast;
use App\Models\User;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Validates Stage 32 C5: Queue Reliability, Timeout Hierarchy & Failure Handling
 */
class NotificationBroadcastJobTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function job_configures_intentional_timeout_and_retry_backoff(): void
    {
        $job = new ProcessNotificationBroadcastJob('test-broadcast-id');

        // Bounded job timeout must be less than worker timeout (120s) and Redis retry_after (180s)
        $this->assertSame(90, $job->timeout);
        $this->assertSame(3, $job->tries);
        $this->assertSame([30, 120, 300], $job->backoff);
    }

    #[Test]
    public function failed_job_transitions_broadcast_to_failed_status_with_error_message(): void
    {
        $user = User::factory()->create();

        $broadcast = NotificationBroadcast::query()->create([
            'title' => 'Test Broadcast Failure',
            'body' => 'Body text',
            'channels' => ['database'],
            'audience_type' => NotificationBroadcastAudience::All,
            'audience_filter' => [],
            'priority' => NotificationPriority::Normal,
            'status' => NotificationBroadcastStatus::Processing,
            'total_recipients' => 10,
            'processed_recipients' => 0,
            'queued_recipients' => 0,
            'created_by' => $user->id,
        ]);

        $job = new ProcessNotificationBroadcastJob($broadcast->id);
        $exception = new Exception('Simulated fatal timeout in chunk processing');

        $job->failed($exception);

        $broadcast->refresh();
        $this->assertSame(NotificationBroadcastStatus::Failed, $broadcast->status);
        $this->assertSame('Simulated fatal timeout in chunk processing', $broadcast->last_error);
        $this->assertNotNull($broadcast->completed_at);
    }

    #[Test]
    public function expired_broadcast_is_cancelled_cleanly_without_processing(): void
    {
        $user = User::factory()->create();

        $broadcast = NotificationBroadcast::query()->create([
            'title' => 'Expired Broadcast',
            'body' => 'Should not be sent',
            'channels' => ['database'],
            'audience_type' => NotificationBroadcastAudience::All,
            'audience_filter' => [],
            'priority' => NotificationPriority::Normal,
            'status' => NotificationBroadcastStatus::Pending,
            'expires_at' => now()->subHour(),
            'total_recipients' => 10,
            'processed_recipients' => 0,
            'queued_recipients' => 0,
            'created_by' => $user->id,
        ]);

        $job = new ProcessNotificationBroadcastJob($broadcast->id);
        $job->handle(
            app(NotificationBroadcastService::class),
            app(NotificationDispatcher::class)
        );

        $broadcast->refresh();
        $this->assertSame(NotificationBroadcastStatus::Cancelled, $broadcast->status);
        $this->assertSame('Broadcast expired before completion.', $broadcast->last_error);
    }
}
