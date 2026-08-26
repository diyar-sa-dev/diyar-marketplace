<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\OrderStatus;
use App\Enums\PaymentAttemptStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentVendorAllocation;
use App\Models\Product;
use App\Models\User;
use App\Services\Payments\PaymentAllocationSnapshotService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
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
    }

    #[Test]
    public function customer_can_initiate_payment_and_receive_session(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $response = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'init-key-1',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.session.session_id', FakePaymentGateway::$sessionId)
            ->assertJsonPath('data.methods.0.code', 'mada');

        $this->assertDatabaseHas('payment_vendor_allocations', [
            'payment_id' => $order->payment->id,
        ]);
    }

    #[Test]
    public function initiate_is_idempotent_for_same_key(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'init-key-2',
        ])->assertOk();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'init-key-2',
        ])->assertOk();

        $this->assertSame(1, $order->payment->attempts()->where('idempotency_key', 'init-key-2')->count());
    }

    #[Test]
    public function customer_can_submit_payment_and_receive_redirect_url(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'submit-key-1',
        ])->assertOk();

        $response = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'submit-key-1',
            'payment_method' => 'mada',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.payment_url', FakePaymentGateway::$paymentUrl);

        $this->assertDatabaseHas('payment_attempts', [
            'payment_id' => $order->payment->id,
            'status' => PaymentAttemptStatus::Submitted->value,
            'gateway_payment_url' => FakePaymentGateway::$paymentUrl,
        ]);
    }

    #[Test]
    public function submit_rejects_invalid_payment_method(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'invalid-method',
        ])->assertOk();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'invalid-method',
            'payment_method' => 'bitcoin',
        ])->assertUnprocessable();
    }

    #[Test]
    public function submit_replay_returns_stored_payment_url(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'replay-key',
        ]);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'replay-key',
            'payment_method' => 'mada',
        ]);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'replay-key',
            'payment_method' => 'mada',
        ])->assertOk()->assertJsonPath('data.payment_url', FakePaymentGateway::$paymentUrl);
    }

    #[Test]
    public function another_user_cannot_initiate_payment_for_foreign_order(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $intruder = $this->createUserWithRole(RoleName::Customer);

        $this->postJsonAsUser("/api/v1/orders/{$order->id}/payment", $intruder, [
            'idempotency_key' => 'blocked',
        ])->assertForbidden();
    }

    #[Test]
    public function gateway_receives_platform_total_without_supplier_split(): void
    {
        $fake = $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'no-suppliers',
        ]);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'no-suppliers',
            'payment_method' => 'mada',
        ]);

        $this->assertCount(1, $fake::$creationRequests);
        $this->assertSame([], $fake::$creationRequests[0]->suppliers);
        $this->assertSame($order->order_number, $fake::$creationRequests[0]->orderNumber);
        $this->assertSame(number_format((float) $order->grand_total, 2, '.', ''), $fake::$creationRequests[0]->amount);
    }

    #[Test]
    public function finalization_marks_payment_paid_and_confirms_order(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $payment = $order->payment;

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $this->assertSame(PaymentStatus::Paid, $payment->fresh()->status);
        $this->assertSame(OrderStatus::Confirmed, $order->fresh()->status);
    }

    #[Test]
    public function duplicate_finalization_is_idempotent(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $service = app(PaymentFinalizationService::class);

        $service->finalizePaid($order->payment, 'pay-1', 'inv-1');
        $service->finalizePaid($order->payment->fresh(), 'pay-1', 'inv-1');

        $this->assertSame(1, Payment::query()->where('order_id', $order->id)->where('status', PaymentStatus::Paid)->count());
    }

    #[Test]
    public function order_cancel_marks_pending_payment_cancelled(): void
    {
        [, $order] = $this->createPayableOrder();
        $customer = User::query()->findOrFail($order->user_id);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/cancel")->assertOk();

        $this->assertSame(PaymentStatus::Cancelled, $order->payment->fresh()->status);
    }

    #[Test]
    public function vendor_allocations_snapshot_vendor_payable_amounts(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $customer = User::query()->findOrFail($order->user_id);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'alloc-key',
        ]);

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $order->payment->id)->first();
        $this->assertNotNull($allocation);
        $this->assertSame($order->payment->currency, $allocation->currency);
        $this->assertSame('10.00', (string) $allocation->platform_commission_amount);
    }

    #[Test]
    public function multi_vendor_order_creates_one_payment_and_multiple_allocations_without_supplier_split(): void
    {
        $fake = $this->fakePaymentGateway();
        [$customer, $order] = $this->createMultiVendorPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'multi-vendor',
        ])->assertOk();

        $allocations = PaymentVendorAllocation::query()
            ->where('payment_id', $order->payment->id)
            ->get();

        $this->assertCount(2, $allocations);
        $this->assertSame(1, Payment::query()->where('order_id', $order->id)->count());

        $allocatedTotal = $allocations->sum(fn ($row) => (float) $row->vendor_gross_total);
        $this->assertSame(
            number_format((float) $order->grand_total, 2, '.', ''),
            number_format($allocatedTotal, 2, '.', ''),
        );

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'multi-vendor',
            'payment_method' => 'mada',
        ])->assertOk();

        $this->assertSame([], $fake::$creationRequests[0]->suppliers);
        $this->assertSame(
            number_format((float) $order->grand_total, 2, '.', ''),
            $fake::$creationRequests[0]->amount,
        );
    }

    #[Test]
    public function customer_can_simulate_failed_then_success_after_submit(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $init = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'simulate-retry',
        ])->assertOk();

        $attemptId = $init->json('data.attempt_id');

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'simulate-retry',
            'payment_method' => 'mada',
        ])->assertOk();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/simulate", [
            'attempt_id' => $attemptId,
            'outcome' => 'failed',
        ])->assertOk()
            ->assertJsonPath('data.status', PaymentStatus::Pending->value);

        $this->assertSame(PaymentStatus::Pending, $order->payment->fresh()->status);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/simulate", [
            'attempt_id' => $attemptId,
            'outcome' => 'success',
        ])->assertOk()
            ->assertJsonPath('data.status', PaymentStatus::Paid->value);

        $this->assertSame(PaymentStatus::Paid, $order->payment->fresh()->status);
        $this->assertSame(OrderStatus::Confirmed, $order->fresh()->status);
    }

    #[Test]
    public function simulate_success_recovers_from_stuck_failed_payment_state(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $init = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'stuck-failed',
        ])->assertOk();

        $attemptId = $init->json('data.attempt_id');

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'stuck-failed',
            'payment_method' => 'mada',
        ])->assertOk();

        $order->payment->update(['status' => PaymentStatus::Failed]);

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/simulate", [
            'attempt_id' => $attemptId,
            'outcome' => 'success',
        ])->assertOk()
            ->assertJsonPath('data.status', PaymentStatus::Paid->value);

        $this->assertSame(PaymentStatus::Paid, $order->payment->fresh()->status);
    }

    #[Test]
    public function allocation_snapshot_must_match_payment_amount(): void
    {
        [, $order] = $this->createPayableOrder();
        $payment = $order->payment;

        app(PaymentAllocationSnapshotService::class)->snapshotForPayment($payment);
        $payment->update(['amount' => '9999.00']);

        $this->expectException(\InvalidArgumentException::class);

        app(PaymentAllocationSnapshotService::class)->assertAllocationsMatchPayment($payment->fresh());
    }

    /**
     * @return array{0: User, 1: Order}
     */
    protected function createMultiVendorPayableOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);

        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);
        $this->createVendorShippingSettings($vendorA->vendorAccount);
        $this->createVendorShippingSettings($vendorB->vendorAccount);

        $productA = Product::factory()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'sale_price' => '500.00',
        ]);
        $productB = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
            'sale_price' => '300.00',
        ]);

        $this->addProductToUserCart($customer, $productA, 1);
        $this->addProductToUserCart($customer, $productB, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            [
                'shipping_address_id' => $address->id,
                'vendor_delivery_selections' => [
                    ['vendor_account_id' => $vendorA->vendorAccount->id, 'method' => 'carrier'],
                    ['vendor_account_id' => $vendorB->vendorAccount->id, 'method' => 'carrier'],
                ],
            ],
            ['Idempotency-Key' => (string) Str::uuid()],
        );

        $response->assertCreated();
        $order = Order::query()->with('payment', 'vendorOrders')->findOrFail($response->json('data.order.id'));

        return [$customer, $order];
    }

    /**
     * @return array{0: User, 1: Order}
     */
    protected function createPayableOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = $vendor->vendorAccount;
        $this->createVendorShippingSettings($vendorAccount);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendorAccount->id,
            'sale_price' => '100.00',
        ]);

        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        );

        $response->assertCreated();
        $orderId = $response->json('data.order.id');
        $order = Order::query()->with('payment', 'vendorOrders')->findOrFail($orderId);

        return [$customer, $order];
    }
}
