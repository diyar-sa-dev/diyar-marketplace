<?php

namespace Tests\Feature\Api\V1\Returns;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\Product;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Models\VendorReturnPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class RefundIdempotencyTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_refund_processing_is_idempotent_by_key(): void
    {
        [$customer, $vendor, $returnRequest] = $this->createInspectedReturn();

        $first = $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnRequest->id}/refund", $vendor, [
            'idempotency_key' => 'same-refund-key',
        ])->assertOk();

        $second = $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnRequest->id}/refund", $vendor, [
            'idempotency_key' => 'same-refund-key',
        ])->assertOk();

        $this->assertSame($first->json('data.return_request.refund.id'), $second->json('data.return_request.refund.id'));
        $this->assertSame(1, Refund::query()->count());
    }

    /**
     * @return array{0: User, 1: User, 2: ReturnRequest}
     */
    private function createInspectedReturn(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 100.00,
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

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => 'idem-payment',
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();

        $order = Order::query()->with(['vendorOrders.items'])->findOrFail($orderId);
        $vendorOrder = $order->vendorOrders->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'IDEM-1',
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $item = $vendorOrder->items->first();

        $returnId = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::Damaged->value,
            'evidence_provided' => true,
            'items' => [
                ['order_item_id' => $item->id, 'quantity' => 1],
            ],
        ])->assertCreated()->json('data.return_request.id');

        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/submit-review", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/approve", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/received", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/inspect", $vendor)->assertOk();

        return [$customer, $vendor, ReturnRequest::query()->findOrFail($returnId)];
    }
}
