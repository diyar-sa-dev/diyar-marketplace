<?php

namespace Tests\Feature\Jobs;

use App\Enums\PaymentWebhookProcessingStatus;
use App\Jobs\Payments\ProcessPaymentWebhookJob;
use App\Models\PaymentWebhookEvent;
use App\Services\Payments\PaymentWebhookEventProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProcessPaymentWebhookJobTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function duplicate_job_dispatch_is_unique_per_event_id(): void
    {
        Queue::fake();

        $eventId = PaymentWebhookEvent::query()->create([
            'gateway' => 'fake',
            'event_type' => 'PaymentStatusChanged',
            'webhook_version' => 'v2',
            'signature_valid' => false,
            'payload_hash' => hash('sha256', 'job-unique'),
            'payload' => [],
            'processing_status' => PaymentWebhookProcessingStatus::Pending,
        ])->id;

        ProcessPaymentWebhookJob::dispatch($eventId);
        ProcessPaymentWebhookJob::dispatch($eventId);

        Queue::assertPushed(ProcessPaymentWebhookJob::class, 1);
    }

    #[Test]
    public function job_handler_is_safe_when_processor_runs_twice(): void
    {
        $event = PaymentWebhookEvent::query()->create([
            'gateway' => 'fake',
            'event_type' => 'PaymentStatusChanged',
            'webhook_version' => 'v2',
            'signature_valid' => false,
            'payload_hash' => hash('sha256', 'job-idempotent'),
            'payload' => [],
            'processing_status' => PaymentWebhookProcessingStatus::Pending,
        ]);

        $job = new ProcessPaymentWebhookJob($event->id);
        $job->handle(app(PaymentWebhookEventProcessor::class));
        $job->handle(app(PaymentWebhookEventProcessor::class));

        $event->refresh();
        $this->assertSame(PaymentWebhookProcessingStatus::Failed, $event->processing_status);
        $this->assertSame(1, $event->processing_attempts);
    }
}
