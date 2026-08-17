<?php

namespace Tests\Feature\Api\V1\Returns;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\VendorReturnPolicy;
use App\Services\Returns\RefundCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class ReturnHardeningTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_policy_snapshot_is_frozen_and_not_affected_by_later_vendor_policy_changes(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(
            salePrice: 200.00,
            policy: [
                'return_window_days' => 7,
                'accepted_reasons' => [ReturnReason::ManufacturingDefect->value],
                'shipping_refundable' => true,
            ],
        );

        $returnId = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.return_request.id');

        $snapshot = ReturnRequest::query()->findOrFail($returnId)->policy_snapshot;
        $this->assertArrayHasKey('effective', $snapshot);
        $this->assertSame(7, $snapshot['effective']['return_window_days']);

        VendorReturnPolicy::query()
            ->where('vendor_account_id', $vendor->vendorAccount->id)
            ->update([
                'return_window_days' => 1,
                'shipping_refundable' => false,
                'accepted_reasons' => [ReturnReason::Damaged->value],
            ]);

        $returnRequest = ReturnRequest::query()->with(['items.orderItem', 'vendorOrder'])->findOrFail($returnId);
        $calculation = app(RefundCalculationService::class)->calculate($returnRequest);

        $this->assertTrue((bool) ($calculation->breakdown['shipping_refundable'] ?? false));
        $this->assertSame(7, $returnRequest->fresh()->policy_snapshot['effective']['return_window_days']);
    }

    public function test_multiple_partial_returns_exhaust_quantity(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(
            quantity: 5,
            salePrice: 50.00,
        );

        $quantities = [2, 1, 2];
        foreach ($quantities as $qty) {
            $this->postJsonAsUser('/api/v1/returns', $customer, [
                'vendor_order_id' => $vendorOrder->id,
                'reason' => ReturnReason::ManufacturingDefect->value,
                'items' => [['order_item_id' => $item->id, 'quantity' => $qty]],
            ])->assertCreated();
        }

        $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_non_returnable_product_is_rejected(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(
            productOverrides: [
                'return_policy_override_enabled' => true,
                'returnable' => false,
            ],
        );

        $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422);
    }

    public function test_partially_refunded_payment_still_allows_return(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(quantity: 2, salePrice: 100.00);

        $firstReturnId = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.return_request.id');

        $this->advanceReturnToRefunded($vendor, $firstReturnId);

        $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated();
    }

    public function test_vat_refund_uses_historical_allocation_proportion(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(salePrice: 1000.00);

        $returnId = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.return_request.id');

        $this->advanceReturnToInspected($vendor, $returnId);

        $returnRequest = ReturnRequest::query()->with(['items.orderItem', 'vendorOrder'])->findOrFail($returnId);
        $calculation = app(RefundCalculationService::class)->calculate($returnRequest);

        $this->assertSame('1000.00', $calculation->itemsSubtotal);
        $this->assertGreaterThan(0, (float) $calculation->vatAmount);
        $this->assertSame(
            bcadd($calculation->itemsSubtotal, $calculation->vatAmount, 2),
            $calculation->totalAmount,
        );
    }

    /**
     * @param  array<string, mixed>  $policy
     * @param  array<string, mixed>  $productOverrides
     * @return array{0: User, 1: User, 2: VendorOrder, 3: OrderItem}
     */
    private function deliverSingleItemOrder(
        int $quantity = 1,
        float $salePrice = 150.00,
        array $policy = [],
        array $productOverrides = [],
    ): array {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $product = Product::factory()->create(array_merge([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => $salePrice,
            'return_requires_evidence' => false,
        ], $productOverrides));

        VendorReturnPolicy::query()->create(array_merge([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 14,
            'accepted_reasons' => [ReturnReason::ManufacturingDefect->value],
            'requires_unused' => false,
            'requires_evidence' => false,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ], $policy));

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);

        $this->addProductToUserCart($customer, $product, $quantity);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => (string) Str::uuid(),
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();

        $order = Order::query()->with(['vendorOrders.items', 'vendorOrders.shipment'])->findOrFail($orderId);
        $vendorOrder = $order->vendorOrders->first();
        $item = $vendorOrder->items->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'HARD-'.$vendorOrder->id,
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $vendorOrder->refresh()->load(['items', 'shipment']);
        $item->refresh();

        return [$customer, $vendor, $vendorOrder, $item];
    }

    private function advanceReturnToInspected(User $vendor, string $returnId): void
    {
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/submit-review", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/approve", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/received", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/inspect", $vendor)->assertOk();
    }

    private function advanceReturnToRefunded(User $vendor, string $returnId): void
    {
        $this->advanceReturnToInspected($vendor, $returnId);
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/refund", $vendor, [
            'idempotency_key' => 'refund-'.$returnId,
        ])->assertOk();
    }
}
