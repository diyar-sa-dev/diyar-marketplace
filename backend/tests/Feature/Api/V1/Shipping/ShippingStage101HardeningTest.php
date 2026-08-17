<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\RoleName;
use App\Enums\ShippingMethod;
use App\Models\Order;
use App\Models\PaymentVendorAllocation;
use App\Models\Product;
use App\Models\VendorOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class ShippingStage101HardeningTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        config(['diyar.payments.use_fake_gateway' => true]);
    }

    public function test_checkout_ignores_client_supplied_amount_fields(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 200.00]);
        $this->createVendorShippingSettings($product->vendorAccount, [
            'carrier_flat_rate' => '25.00',
            'pickup_enabled' => false,
        ]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $payload = array_merge($this->checkoutPayload($address, $product), [
            'shipping_total' => '0.01',
            'grand_total' => '1.00',
            'totals' => ['shipping' => '0.00'],
        ]);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)
            ->assertOk()
            ->assertJsonPath('data.preview.totals.shipping', '25.00');
    }

    public function test_payment_allocation_shipping_cost_matches_vendor_order_snapshot(): void
    {
        $this->fakePaymentGateway();
        $customer = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create(['sale_price' => 200.00]);
        $productB = Product::factory()->create(['sale_price' => 300.00]);

        $this->createVendorShippingSettings($productA->vendorAccount, [
            'carrier_flat_rate' => '25.00',
            'pickup_enabled' => false,
        ]);
        $this->createVendorShippingSettings($productB->vendorAccount, [
            'carrier_flat_rate' => '15.00',
            'pickup_enabled' => false,
        ]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $productA);
        $this->addProductToUserCart($customer, $productB);

        $payload = [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $productA->vendor_account_id, 'method' => ShippingMethod::Carrier->value],
                ['vendor_account_id' => $productB->vendor_account_id, 'method' => ShippingMethod::Carrier->value],
            ],
        ];

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $payload,
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $orderId = $orderResponse->json('data.order.id');
        $order = Order::query()->with('payment')->findOrFail($orderId);
        $vendorOrders = VendorOrder::query()->where('order_id', $orderId)->get()->keyBy('vendor_account_id');

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => 'alloc-shipping-key',
        ])->assertOk();

        $paymentId = $order->payment->id;

        foreach ($vendorOrders as $vendorAccountId => $vendorOrder) {
            $allocation = PaymentVendorAllocation::query()
                ->where('payment_id', $paymentId)
                ->where('vendor_order_id', $vendorOrder->id)
                ->firstOrFail();

            $this->assertSame(
                number_format((float) $vendorOrder->shipping_cost, 2, '.', ''),
                number_format((float) $allocation->shipping_cost, 2, '.', ''),
                "Allocation shipping_cost mismatch for vendor {$vendorAccountId}",
            );
        }
    }

    public function test_vendor_cannot_update_another_vendors_shipping_settings(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $this->createVendorShippingSettings($vendorA->vendorAccount, ['carrier_flat_rate' => '25.00']);
        $settingsB = $this->createVendorShippingSettings($vendorB->vendorAccount, ['carrier_flat_rate' => '15.00']);

        $this->putStatefulJsonAsUser('/api/v1/dashboard/vendor/shipping-settings', $vendorA, [
            'carrier_enabled' => true,
            'carrier_flat_rate' => '99.00',
            'carrier_free_shipping_enabled' => false,
            'carrier_free_shipping_threshold' => null,
            'pickup_enabled' => false,
            'pickup_location_label' => null,
        ])->assertOk();

        $settingsB->refresh();
        $this->assertSame('15.00', $settingsB->carrier_flat_rate);
    }

    public function test_fulfillment_actions_are_idempotent(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);
        $this->createVendorShippingSettings($product->vendorAccount);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $vendorOrder = VendorOrder::query()
            ->where('order_id', $orderResponse->json('data.order.id'))
            ->firstOrFail();

        $acceptUrl = "/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept";
        $this->postJsonAsUser($acceptUrl, $vendor)->assertOk();
        $this->postJsonAsUser($acceptUrl, $vendor)->assertOk();

        $processUrl = "/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process";
        $this->postJsonAsUser($processUrl, $vendor)->assertOk();
        $this->postJsonAsUser($processUrl, $vendor)->assertOk();

        $shipUrl = "/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship";
        $this->postJsonAsUser($shipUrl, $vendor, [
            'tracking_number' => 'TRK-IDEMPOTENT',
            'carrier' => 'SMSA',
        ])->assertOk();

        $this->postJsonAsUser($shipUrl, $vendor, [
            'tracking_number' => 'TRK-OVERWRITE-ATTEMPT',
            'carrier' => 'Aramex',
        ])->assertOk()
            ->assertJsonPath('data.vendor_order.shipment.tracking_number', 'TRK-IDEMPOTENT')
            ->assertJsonPath('data.vendor_order.shipment.carrier', 'SMSA');

        $deliverUrl = "/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver";
        $this->postJsonAsUser($deliverUrl, $vendor)->assertOk();
        $this->postJsonAsUser($deliverUrl, $vendor)->assertOk()
            ->assertJsonPath('data.vendor_order.status', 'delivered');
    }

    public function test_vendor_can_cancel_before_shipment(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);
        $this->createVendorShippingSettings($product->vendorAccount);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $vendorOrder = VendorOrder::query()
            ->where('order_id', $orderResponse->json('data.order.id'))
            ->firstOrFail();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor);
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/cancel", $vendor)
            ->assertOk()
            ->assertJsonPath('data.vendor_order.status', 'cancelled')
            ->assertJsonPath('data.vendor_order.shipment.status', 'cancelled');

        $this->assertSame(
            'cancelled',
            Order::query()->findOrFail($orderResponse->json('data.order.id'))->status->value,
        );
    }

    public function test_pickup_order_can_ship_without_tracking_number(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);
        $this->createVendorShippingSettings($product->vendorAccount, [
            'pickup_enabled' => true,
            'pickup_location_label' => 'Riyadh Branch',
        ]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product, ShippingMethod::Pickup->value),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $vendorOrder = VendorOrder::query()
            ->where('order_id', $orderResponse->json('data.order.id'))
            ->firstOrFail();

        $this->assertSame(ShippingMethod::Pickup->value, $vendorOrder->shipping_method);

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor);
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor);

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => '',
        ])->assertOk()
            ->assertJsonPath('data.vendor_order.shipment.tracking_number', 'PICKUP');
    }
}
