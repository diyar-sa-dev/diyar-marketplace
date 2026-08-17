<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\RoleName;
use App\Enums\ShippingMethod;
use App\Models\Product;
use App\Models\VendorOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ShippingCheckoutIntegrationTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_multi_vendor_checkout_sums_independent_shipping_costs(): void
    {
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

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)
            ->assertOk()
            ->assertJsonPath('data.preview.totals.subtotal', '500.00')
            ->assertJsonPath('data.preview.totals.shipping', '40.00');
    }

    public function test_pickup_shipping_is_zero_for_vendor_sub_order(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 150.00]);
        $this->createVendorShippingSettings($product->vendorAccount, [
            'carrier_flat_rate' => '25.00',
            'pickup_enabled' => true,
            'pickup_location_label' => 'Riyadh Store',
        ]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product, ShippingMethod::Pickup->value))
            ->assertOk()
            ->assertJsonPath('data.preview.totals.shipping', '0.00')
            ->assertJsonPath('data.preview.vendor_groups.0.shipping.cost', '0.00')
            ->assertJsonPath('data.preview.vendor_groups.0.shipping.pickup_location_label', 'Riyadh Store');
    }

    public function test_free_shipping_threshold_is_evaluated_per_vendor(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create(['sale_price' => 350.00]);
        $productB = Product::factory()->create(['sale_price' => 200.00]);

        $this->createVendorShippingSettings($productA->vendorAccount, [
            'carrier_flat_rate' => '25.00',
            'carrier_free_shipping_enabled' => true,
            'carrier_free_shipping_threshold' => '300.00',
            'pickup_enabled' => false,
        ]);
        $this->createVendorShippingSettings($productB->vendorAccount, [
            'carrier_flat_rate' => '15.00',
            'carrier_free_shipping_enabled' => true,
            'carrier_free_shipping_threshold' => '500.00',
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

        $response = $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $payload)
            ->assertOk()
            ->assertJsonPath('data.preview.totals.shipping', '15.00');

        $groups = collect($response->json('data.preview.vendor_groups'));
        $groupA = $groups->firstWhere('vendor_account_id', $productA->vendor_account_id);
        $groupB = $groups->firstWhere('vendor_account_id', $productB->vendor_account_id);

        $this->assertSame('0.00', $groupA['shipping']['cost']);
        $this->assertTrue($groupA['shipping']['free_shipping_applied']);
        $this->assertSame('15.00', $groupB['shipping']['cost']);
        $this->assertFalse($groupB['shipping']['free_shipping_applied']);
    }

    public function test_order_stores_historical_shipping_snapshot_when_vendor_settings_change(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 200.00]);
        $settings = $this->createVendorShippingSettings($product->vendorAccount, [
            'carrier_flat_rate' => '25.00',
            'pickup_enabled' => false,
        ]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderResponse = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $orderId = $orderResponse->json('data.order.id');
        $vendorOrder = VendorOrder::query()->where('order_id', $orderId)->firstOrFail();

        $this->assertSame('25.00', $vendorOrder->shipping_cost);
        $this->assertSame(ShippingMethod::Carrier->value, $vendorOrder->shipping_method);

        $settings->update(['carrier_flat_rate' => '40.00']);

        $vendorOrder->refresh();
        $this->assertSame('25.00', $vendorOrder->shipping_cost);
    }

    public function test_customer_cannot_select_shipping_method_for_another_vendor(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create(['sale_price' => 100.00]);
        $productB = Product::factory()->create(['sale_price' => 100.00]);

        $this->createVendorShippingSettings($productA->vendorAccount, ['pickup_enabled' => false]);
        $this->createVendorShippingSettings($productB->vendorAccount, ['pickup_enabled' => false]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $productA);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $productB->vendor_account_id, 'method' => ShippingMethod::Carrier->value],
            ],
        ])->assertUnprocessable();
    }

    public function test_pickup_method_rejected_when_vendor_pickup_disabled(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount, [
            'pickup_enabled' => false,
        ]);

        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product, ShippingMethod::Pickup->value))
            ->assertUnprocessable();
    }
}
