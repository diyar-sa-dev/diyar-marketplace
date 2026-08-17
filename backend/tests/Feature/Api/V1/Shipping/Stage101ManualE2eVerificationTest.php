<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\RoleName;
use App\Enums\ShippingMethod;
use App\Models\Order;
use App\Models\Product;
use App\Models\VendorOrder;
use App\Models\VendorShippingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

/**
 * Stage 10.1 manual E2E scenario executed as an automated verification test.
 *
 * Vendor A: 25 SAR / free > 300 / pickup ON
 * Vendor B: 15 SAR / pickup OFF
 * Multi-vendor cart → checkout → pay → fulfill → settings change → historical immutability
 */
class Stage101ManualE2eVerificationTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    /** @var array<string, mixed> */
    private array $evidence = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
        config(['diyar.payments.use_fake_gateway' => true]);
    }

    public function test_stage_10_1_multi_vendor_shipping_e2e_with_evidence(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $productA = Product::factory()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'sale_price' => 200.00,
        ]);
        $productB = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
            'sale_price' => 250.00,
        ]);

        $settingsA = $this->createVendorShippingSettings($productA->vendorAccount, [
            'carrier_flat_rate' => '25.00',
            'carrier_free_shipping_enabled' => true,
            'carrier_free_shipping_threshold' => '300.00',
            'pickup_enabled' => true,
            'pickup_location_label' => 'Vendor A Branch',
        ]);
        $settingsB = $this->createVendorShippingSettings($productB->vendorAccount, [
            'carrier_flat_rate' => '15.00',
            'pickup_enabled' => false,
        ]);

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

        $preview = $this->postJsonAsUser('/api/v1/checkout/preview', $customer, $checkoutPayload)
            ->assertOk();

        $this->evidence['checkout_preview'] = [
            'shipping_total' => $preview->json('data.preview.totals.shipping'),
            'grand_total' => $preview->json('data.preview.totals.grand_total'),
            'vendor_groups' => collect($preview->json('data.preview.vendor_groups'))->map(fn (array $group) => [
                'vendor_account_id' => $group['vendor_account_id'],
                'shipping_cost' => $group['shipping']['cost'],
                'method' => $group['shipping']['method'],
            ])->all(),
        ];

        $this->assertSame('40.00', $this->evidence['checkout_preview']['shipping_total']);

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $checkoutPayload,
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $orderId = $orderResponse->json('data.order.id');
        $order = Order::query()->with(['payment', 'vendorOrders.shipment'])->findOrFail($orderId);

        $this->evidence['order_created'] = [
            'order_id' => $orderId,
            'order_number' => $order->order_number,
            'shipping_total' => $order->shipping_total,
            'grand_total' => $order->grand_total,
            'vendor_orders' => $order->vendorOrders->map(fn (VendorOrder $vo) => [
                'id' => $vo->id,
                'vendor_account_id' => $vo->vendor_account_id,
                'shipping_cost' => $vo->shipping_cost,
                'shipping_method' => $vo->shipping_method,
                'shipment_status' => $vo->shipment?->status->value,
            ])->all(),
        ];

        $this->assertSame('40.00', $order->shipping_total);
        $this->assertCount(2, $order->vendorOrders);

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => 'e2e-payment-init',
        ])->assertOk();

        $attemptId = $paymentInit->json('data.attempt_id');

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $attemptId,
            'outcome' => 'success',
        ])->assertOk();

        $order->refresh()->load(['payment', 'vendorOrders.shipment']);

        $this->evidence['payment'] = [
            'status' => $order->payment->status->value,
            'amount' => $order->payment->amount,
            'order_grand_total' => $order->grand_total,
        ];

        $this->assertSame('paid', $order->payment->status->value);
        $this->assertSame($order->grand_total, $order->payment->amount);

        foreach ($order->vendorOrders as $vendorOrder) {
            $vendorUser = $vendorOrder->vendor_account_id === $vendorA->vendorAccount->id ? $vendorA : $vendorB;

            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendorUser)->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendorUser)->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendorUser, [
                'tracking_number' => 'E2E-'.$vendorOrder->id,
                'carrier' => 'SMSA',
            ])->assertOk();
            $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendorUser)->assertOk();
        }

        $order->refresh()->load(['vendorOrders.shipment']);

        $this->evidence['fulfillment'] = $order->vendorOrders->map(fn (VendorOrder $vo) => [
            'vendor_order_id' => $vo->id,
            'status' => $vo->status->value,
            'tracking_number' => $vo->shipment?->tracking_number,
            'shipped_at' => $vo->shipment?->shipped_at?->toIso8601String(),
            'delivered_at' => $vo->shipment?->delivered_at?->toIso8601String(),
        ])->all();

        $settingsA->update(['carrier_flat_rate' => '40.00']);

        foreach ($order->vendorOrders as $vendorOrder) {
            $vendorOrder->refresh();
            $this->assertNotSame('40.00', $vendorOrder->shipping_cost);
        }

        $vendorOrderA = $order->vendorOrders->firstWhere('vendor_account_id', $vendorA->vendorAccount->id);
        $this->assertSame('25.00', $vendorOrderA->shipping_cost);

        $this->evidence['historical_immutability'] = [
            'settings_a_carrier_flat_rate_now' => VendorShippingSettings::query()->find($settingsA->id)?->carrier_flat_rate,
            'order_a_shipping_cost_snapshot' => $vendorOrderA->shipping_cost,
        ];

        $this->assertSame('40.00', $this->evidence['historical_immutability']['settings_a_carrier_flat_rate_now']);
        $this->assertSame('25.00', $this->evidence['historical_immutability']['order_a_shipping_cost_snapshot']);

        fwrite(STDERR, "\n--- STAGE 10.1 E2E EVIDENCE ---\n".json_encode($this->evidence, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n");
    }
}
