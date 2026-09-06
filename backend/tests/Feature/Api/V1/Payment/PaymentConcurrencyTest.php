<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\PaymentAttemptStatus;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class PaymentConcurrencyTest extends TestCase
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
    public function concurrent_initiate_requests_with_same_idempotency_key_create_one_attempt(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
                'idempotency_key' => 'concurrent-init',
            ]);
        }

        $this->assertSame(
            1,
            PaymentAttempt::query()
                ->where('payment_id', $order->payment->id)
                ->where('idempotency_key', 'concurrent-init')
                ->count(),
        );
    }

    #[Test]
    public function concurrent_submit_replays_return_single_submitted_attempt(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'concurrent-submit',
        ])->assertOk();

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
                'session_id' => FakePaymentGateway::$sessionId,
                'idempotency_key' => 'concurrent-submit',
                'payment_method' => 'mada',
            ]);
        }

        $this->assertSame(
            1,
            PaymentAttempt::query()
                ->where('payment_id', $order->payment->id)
                ->where('idempotency_key', 'concurrent-submit')
                ->where('status', PaymentAttemptStatus::Submitted->value)
                ->count(),
        );
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
