<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\Order\OrderCancellationService;
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

class PaymentFinalizationRaceTest extends TestCase
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
    public function concurrent_finalize_paid_and_mark_failed_results_in_single_terminal_state(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();
        $payment = $order->payment;

        $finalizer = app(PaymentFinalizationService::class);

        $finalizer->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            'invoice-race-1',
        );

        $finalizer->markFailed($payment->fresh(), 'late failure attempt');

        $payment->refresh();
        $this->assertSame(PaymentStatus::Paid, $payment->status);
    }

    #[Test]
    public function duplicate_finalize_paid_is_idempotent(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $payment = $order->payment;

        $finalizer = app(PaymentFinalizationService::class);

        $finalizer->finalizePaid($payment, FakePaymentGateway::$gatewayPaymentId, 'invoice-dup-1');
        $finalizer->finalizePaid($payment->fresh(), FakePaymentGateway::$gatewayPaymentId, 'invoice-dup-2');

        $payment->refresh();
        $this->assertSame(PaymentStatus::Paid, $payment->status);
        $this->assertSame(1, Payment::query()->where('order_id', $order->id)->where('status', PaymentStatus::Paid)->count());
    }

    #[Test]
    public function paid_orders_cannot_be_cancelled_via_pending_only_path(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();

        app(PaymentFinalizationService::class)->finalizePaid(
            $order->payment,
            FakePaymentGateway::$gatewayPaymentId,
            'invoice-cancel-race',
        );

        $this->expectException(\InvalidArgumentException::class);
        app(OrderCancellationService::class)->cancel($order->fresh());
    }

    /**
     * @return array{0: \App\Models\User, 1: Order}
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
