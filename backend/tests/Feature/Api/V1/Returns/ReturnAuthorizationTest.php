<?php

namespace Tests\Feature\Api\V1\Returns;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\User;
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

class ReturnAuthorizationTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_customer_cannot_view_another_customers_return(): void
    {
        [$customer, $returnRequest] = $this->createReturnRequest();
        $otherCustomer = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser("/api/v1/returns/{$returnRequest->id}", $otherCustomer)->assertForbidden();
    }

    public function test_vendor_cannot_manage_return_for_other_vendor(): void
    {
        [$customer, $returnRequest] = $this->createReturnRequest();
        $otherVendor = $this->createUserWithRole(RoleName::Vendor);

        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnRequest->id}/approve", $otherVendor)
            ->assertForbidden();
    }

    /**
     * @return array{0: User, 1: ReturnRequest}
     */
    private function createReturnRequest(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 120.00,
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

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $order = Order::query()->with(['payment', 'vendorOrders.items'])->findOrFail($orderId);
        app(PaymentFinalizationService::class)->finalizePaid($order->payment, FakePaymentGateway::$gatewayPaymentId, '12345');

        $vendorOrder = $order->vendorOrders->first();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'AUTH-1',
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $item = $vendorOrder->items->first();

        $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::Damaged->value,
            'evidence_provided' => true,
            'items' => [
                ['order_item_id' => $item->id, 'quantity' => 1],
            ],
        ])->assertCreated();

        $returnRequest = ReturnRequest::query()->firstOrFail();

        return [$customer, $returnRequest];
    }
}
