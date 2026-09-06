<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\PaymentWebhookProcessingStatus;
use App\Models\PaymentWebhookEvent;
use App\Services\Payments\PaymentWebhookEventProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use ReflectionMethod;
use Tests\TestCase;

class PaymentWebhookProcessingLeaseTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function concurrent_webhook_processing_claims_only_one_lease(): void
    {
        $event = PaymentWebhookEvent::query()->create([
            'gateway' => 'fake',
            'event_type' => 'PaymentStatusChanged',
            'webhook_version' => 'v2',
            'signature_valid' => true,
            'payload_hash' => hash('sha256', 'lease-test'),
            'payload' => ['data' => []],
            'processing_status' => PaymentWebhookProcessingStatus::Pending,
            'processing_attempts' => 0,
        ]);

        $processor = app(PaymentWebhookEventProcessor::class);
        $method = new ReflectionMethod($processor, 'acquireProcessingLease');
        $method->setAccessible(true);

        $firstClaim = $method->invoke($processor, $event->id);
        $secondClaim = $method->invoke($processor, $event->id);

        $event->refresh();

        $this->assertTrue($firstClaim);
        $this->assertFalse($secondClaim);
        $this->assertSame(1, $event->processing_attempts);
        $this->assertNotNull($event->processing_leased_until);
    }

    #[Test]
    public function expired_lease_allows_reprocessing(): void
    {
        $event = PaymentWebhookEvent::query()->create([
            'gateway' => 'fake',
            'event_type' => 'PaymentStatusChanged',
            'webhook_version' => 'v2',
            'signature_valid' => true,
            'payload_hash' => hash('sha256', 'lease-expired'),
            'payload' => ['data' => []],
            'processing_status' => PaymentWebhookProcessingStatus::Pending,
            'processing_attempts' => 1,
            'processing_leased_until' => now()->subMinute(),
        ]);

        $processor = app(PaymentWebhookEventProcessor::class);
        $method = new ReflectionMethod($processor, 'acquireProcessingLease');
        $method->setAccessible(true);

        $this->assertTrue($method->invoke($processor, $event->id));

        $event->refresh();
        $this->assertSame(2, $event->processing_attempts);
    }
}
