<?php

namespace Tests\Feature\Api\V1\Returns;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\VendorReturnPolicy;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class ReturnEligibilityTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_delivered_paid_item_is_eligible_within_window(): void
    {
        [$customer, $vendorOrder, $orderItem] = $this->createDeliveredVendorOrder();

        $response = $this->getJsonAsUser(
            "/api/v1/vendor-orders/{$vendorOrder->id}/items/{$orderItem->id}/return-eligibility",
            $customer,
        )->assertOk();

        $this->assertTrue($response->json('data.eligible'));
        $this->assertSame(1, $response->json('data.remaining_quantity'));
    }

    public function test_item_outside_return_window_is_not_eligible(): void
    {
        [$customer, $vendorOrder, $orderItem] = $this->createDeliveredVendorOrder();

        $vendorOrder->shipment?->update(['delivered_at' => now()->subDays(20)]);

        $this->getJsonAsUser(
            "/api/v1/vendor-orders/{$vendorOrder->id}/items/{$orderItem->id}/return-eligibility",
            $customer,
        )->assertOk()
            ->assertJsonPath('data.eligible', false);
    }

    /**
     * @return array{0: User, 1: VendorOrder, 2: OrderItem}
     */
    private function createDeliveredVendorOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 150.00,
            'return_policy_override_enabled' => true,
            'return_requires_evidence' => false,
        ]);

        VendorReturnPolicy::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 14,
            'accepted_reasons' => ReturnReason::values(),
            'requires_unused' => false,
            'requires_evidence' => false,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ]);

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $order = Order::query()->with(['payment', 'vendorOrders.items', 'vendorOrders.shipment'])->findOrFail($orderResponse->json('data.order.id'));
        app(PaymentFinalizationService::class)->finalizePaid($order->payment, FakePaymentGateway::$gatewayPaymentId, '12345');

        $vendorOrder = $order->vendorOrders->first();
        $orderItem = $vendorOrder->items->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'RTN-TRACK-1',
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $vendorOrder->refresh()->load(['items', 'shipment']);

        return [$customer, $vendorOrder, $orderItem];
    }
}
