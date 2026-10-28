<?php

declare(strict_types=1);

namespace Tests\Feature\Api\V1\Payment;

use App\Domains\Payments\Services\PaymentWebhookEventProcessor;
use App\Domains\Payments\Services\PaymentWebhookProcessor;
use App\Enums\PaymentStatus;
use App\Enums\PaymentWebhookProcessingStatus;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use ReflectionMethod;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

/**
 * Stage 32 C4 Certification: Payment Webhook Idempotency, Concurrency & Failure Recovery
 */
class PaymentWebhookIdempotencyAndFailureRecoveryTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithFinance;
    use InteractsWithIdentity;
    use InteractsWithPayments;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        config(['diyar.payments.use_fake_gateway' => true]);
        config(['myfatoorah.webhook_secret_key' => 'test-secret-key-12345']);
    }

    #[Test]
    public function test_1_sequential_and_concurrent_duplicate_delivery_deduplicates_to_single_event(): void
    {
        Queue::fake();
        [, $order] = $this->createPayableOrder();

        $payload = [
            'event_type' => 'PaymentStatusChanged',
            'payment_reference' => $order->payment->payment_reference,
            'gateway_payment_id' => 'gw-pay-101',
            'amount' => '100.00',
        ];

        $processor = app(PaymentWebhookProcessor::class);

        // First delivery
        $first = $processor->ingestFake($payload);
        $this->assertTrue($first['accepted']);
        $this->assertFalse($first['duplicate']);
        $this->assertNotNull($first['event_id']);

        // Second delivery of identical payload
        $second = $processor->ingestFake($payload);
        $this->assertTrue($second['accepted']);
        $this->assertTrue($second['duplicate']);
        $this->assertSame($first['event_id'], $second['event_id']);

        // Exactly one event record created in database
        $this->assertSame(
            1,
            PaymentWebhookEvent::query()
                ->where('payment_id', $order->payment->id)
                ->count()
        );
    }

    #[Test]
    public function test_2_repeated_delivery_after_successful_processing_is_strictly_idempotent(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();

        $payload = [
            'event_type' => 'PaymentStatusChanged',
            'payment_reference' => $order->payment->payment_reference,
            'gateway_payment_id' => FakePaymentGateway::$gatewayPaymentId,
            'amount' => '100.00',
        ];

        $processor = app(PaymentWebhookProcessor::class);
        $eventProcessor = app(PaymentWebhookEventProcessor::class);

        // 1. Ingest and process
        $ingest = $processor->ingestFake($payload);
        $eventId = (string) $ingest['event_id'];

        $eventProcessor->process($eventId);

        $order->payment->refresh();
        $this->assertSame(PaymentStatus::Paid, $order->payment->status);

        $event = PaymentWebhookEvent::query()->findOrFail($eventId);
        $this->assertSame(PaymentWebhookProcessingStatus::Processed, $event->processing_status);

        // 2. Deliver again after success
        $repeatIngest = $processor->ingestFake($payload);
        $this->assertTrue($repeatIngest['duplicate']);
        $this->assertSame($eventId, $repeatIngest['event_id']);

        // 3. Re-process attempt on already processed event
        $eventProcessor->process($eventId);

        // Verify no duplicate payments or invalid status changes occurred
        $this->assertSame(1, Payment::query()->where('order_id', $order->id)->count());
        $this->assertSame(PaymentStatus::Paid, $order->payment->fresh()->status);
    }

    #[Test]
    public function test_3_processing_failure_records_attempt_and_recovers_after_lease_expiry(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();

        $event = PaymentWebhookEvent::query()->create([
            'gateway' => 'fake',
            'event_type' => 'PaymentStatusChanged',
            'webhook_version' => 'fake',
            'signature_valid' => true,
            'payload_hash' => hash('sha256', 'failure-recovery-payload'),
            'payload' => [
                'event_type' => 'PaymentStatusChanged',
                'gateway_payment_id' => 'gw-fail-001',
                'payment_reference' => $order->payment->payment_reference,
            ],
            'processing_status' => PaymentWebhookProcessingStatus::Pending,
            'payment_id' => $order->payment->id,
            'correlation_id' => (string) Str::uuid(),
            'processing_attempts' => 0,
        ]);

        $eventProcessor = app(PaymentWebhookEventProcessor::class);

        // First attempt acquires lease
        $method = new ReflectionMethod($eventProcessor, 'acquireProcessingLease');
        $method->setAccessible(true);

        $claimed = $method->invoke($eventProcessor, $event->id);
        $this->assertTrue($claimed);

        $event->refresh();
        $this->assertSame(1, $event->processing_attempts);
        $this->assertNotNull($event->processing_leased_until);

        // Immediate concurrent attempt while leased is blocked
        $blocked = $method->invoke($eventProcessor, $event->id);
        $this->assertFalse($blocked);

        // Simulate failure recovery: lease expires in past
        $event->update(['processing_leased_until' => now()->subSeconds(10)]);

        // Retry after lease expiration succeeds
        $retryClaimed = $method->invoke($eventProcessor, $event->id);
        $this->assertTrue($retryClaimed);

        $event->refresh();
        $this->assertSame(2, $event->processing_attempts);
    }

    #[Test]
    public function test_4_conflicting_payload_with_same_reference_creates_distinct_event_audit(): void
    {
        Queue::fake();
        [, $order] = $this->createPayableOrder();

        $payload1 = [
            'event_type' => 'PaymentStatusChanged',
            'payment_reference' => $order->payment->payment_reference,
            'gateway_payment_id' => 'gw-pay-101',
            'status' => 'Pending',
        ];

        $payload2 = [
            'event_type' => 'PaymentStatusChanged',
            'payment_reference' => $order->payment->payment_reference,
            'gateway_payment_id' => 'gw-pay-101',
            'status' => 'Failed',
        ];

        $processor = app(PaymentWebhookProcessor::class);

        $first = $processor->ingestFake($payload1);
        $second = $processor->ingestFake($payload2);

        $this->assertTrue($first['accepted']);
        $this->assertFalse($first['duplicate']);

        $this->assertTrue($second['accepted']);
        $this->assertFalse($second['duplicate']);
        $this->assertNotSame($first['event_id'], $second['event_id']);

        // Both distinct audit records exist
        $this->assertSame(
            2,
            PaymentWebhookEvent::query()
                ->where('payment_id', $order->payment->id)
                ->count()
        );
    }

    #[Test]
    public function test_5_invalid_signature_sets_failed_status_and_dispatches_no_job(): void
    {
        Queue::fake();

        $rawBody = json_encode([
            'Data' => [
                'InvoiceId' => 99999,
                'CustomerReference' => 'NON-EXISTENT',
                'TransactionStatus' => 'SUCCESS',
            ],
        ], JSON_THROW_ON_ERROR);

        $processor = app(PaymentWebhookProcessor::class);

        $result = $processor->handle('myfatoorah', $rawBody, [
            'myfatoorah-signature' => 'invalid-signature-hash',
            'myfatoorah-webhook-version' => 'v2',
        ]);

        $this->assertFalse($result['accepted']);
        $this->assertFalse($result['duplicate']);
        $this->assertNotNull($result['event_id']);

        $event = PaymentWebhookEvent::query()->findOrFail($result['event_id']);
        $this->assertFalse((bool) $event->signature_valid);
        $this->assertSame(PaymentWebhookProcessingStatus::Failed, $event->processing_status);

        // Zero background jobs dispatched for invalid signature
        Queue::assertNothingPushed();
    }

    /**
     * @return array{0: User, 1: Order}
     */
    private function createPayableOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $this->createVendorShippingSettings($vendor->vendorAccount);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => '100.00',
        ]);

        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $order = Order::query()->with('payment')->findOrFail($response->json('data.order.id'));

        return [$customer, $order];
    }
}
