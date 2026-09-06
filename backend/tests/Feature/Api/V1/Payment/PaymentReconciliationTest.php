<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use App\Services\Payments\PaymentReconciliationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class PaymentReconciliationTest extends TestCase
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
    public function reconcile_finalizes_stuck_submitted_payment(): void
    {
        FakePaymentGateway::$detailsStatus = PaymentStatus::Paid;
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment", [
            'idempotency_key' => 'reconcile-key',
        ])->assertOk();

        $this->actingAs($customer)->postJson("/api/v1/orders/{$order->id}/payment/submit", [
            'session_id' => FakePaymentGateway::$sessionId,
            'idempotency_key' => 'reconcile-key',
            'payment_method' => 'mada',
        ])->assertOk();

        PaymentAttempt::query()
            ->where('payment_id', $order->payment->id)
            ->update([
                'updated_at' => now()->subHour(),
            ]);

        $order->payment->update(['status' => PaymentStatus::Processing]);

        $result = app(PaymentReconciliationService::class)->reconcile(30, 10);

        $this->assertGreaterThanOrEqual(1, $result['scanned']);
        $this->assertSame(PaymentStatus::Paid, $order->payment->fresh()->status);
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
