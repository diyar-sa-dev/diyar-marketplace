<?php

namespace Tests\Feature\Api\V1\Returns;

use App\Enums\BalanceBucket;
use App\Enums\FinancialTransactionType;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\ReturnReason;
use App\Enums\ReturnRequestStatus;
use App\Enums\RoleName;
use App\Enums\ShippingMethod;
use App\Models\Order;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\VendorReturnPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class ReturnRefundMultiVendorTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_multi_vendor_order_supports_partial_vendor_refund(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $productA = Product::factory()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'sale_price' => 200.00,
            'return_requires_evidence' => false,
        ]);
        $productB = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
            'sale_price' => 250.00,
        ]);

        foreach ([$vendorA, $vendorB] as $vendor) {
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
        }

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $productA);
        $this->addProductToUserCart($customer, $productB);

        $checkoutPayload = [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $productA->vendor_account_id, 'method' => ShippingMethod::Carrier->value],
                ['vendor_account_id' => $productB->vendor_account_id, 'method' => ShippingMethod::Carrier->value],
            ],
        ];

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $checkoutPayload, [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => 'return-e2e-payment',
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();

        $order = Order::query()->with(['vendorOrders.items', 'vendorOrders.shipment', 'payment'])->findOrFail($orderId);

        foreach ($order->vendorOrders as $vendorOrder) {
            $vendorUser = $vendorOrder->vendor_account_id === $vendorA->vendorAccount->id ? $vendorA : $vendorB;
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendorUser)->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendorUser)->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendorUser, [
                'tracking_number' => 'MV-'.$vendorOrder->id,
            ])->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendorUser)->assertOk();
        }

        $targetVendorOrder = $order->vendorOrders->firstWhere('vendor_account_id', $vendorA->vendorAccount->id);
        $targetItem = $targetVendorOrder->items->first();

        $createResponse = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $targetVendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'evidence_provided' => true,
            'items' => [
                ['order_item_id' => $targetItem->id, 'quantity' => 1],
            ],
        ])->assertCreated();

        $returnId = $createResponse->json('data.return_request.id');

        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/submit-review", $vendorA)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/approve", $vendorA)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/received", $vendorA)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/inspect", $vendorA)->assertOk();

        $refundResponse = $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/refund", $vendorA, [
            'idempotency_key' => 'refund-vendor-a-1',
        ])->assertOk();

        $this->assertSame(ReturnRequestStatus::Refunded->value, $refundResponse->json('data.return_request.status'));
        $this->assertNotNull($refundResponse->json('data.return_request.refund.total_amount'));

        $order->payment->refresh();
        $this->assertSame(PaymentStatus::PartiallyRefunded->value, $order->payment->status->value);

        $this->assertDatabaseHas('refunds', [
            'return_request_id' => $returnId,
            'status' => RefundStatus::Completed->value,
        ]);

        $this->assertDatabaseHas('financial_transactions', [
            'transaction_type' => FinancialTransactionType::Refund->value,
            'balance_bucket' => BalanceBucket::VendorAvailable->value,
        ]);

        $this->assertSame(1, ReturnRequest::query()->where('status', ReturnRequestStatus::Refunded->value)->count());
    }
}
