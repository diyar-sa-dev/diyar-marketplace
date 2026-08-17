<?php

namespace Tests\Feature\Api\V1\Checkout;

use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CheckoutPreviewTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_preview_returns_server_totals_with_shipping_and_vat(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 450.00]);
        $this->createVendorShippingSettings($product->vendorAccount, [
            'carrier_flat_rate' => '28.00',
            'carrier_free_shipping_enabled' => true,
            'carrier_free_shipping_threshold' => '500.00',
        ]);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product))
            ->assertOk()
            ->assertJsonPath('data.preview.valid', true)
            ->assertJsonPath('data.preview.totals.subtotal', '450.00')
            ->assertJsonPath('data.preview.totals.shipping', '28.00');

        $vat = $response->json('data.preview.totals.vat');
        $this->assertSame('71.70', $vat);
    }

    public function test_preview_blocks_when_vendor_shipping_not_configured(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, $this->checkoutPayload($address, $product))
            ->assertUnprocessable();
    }

    public function test_preview_requires_complete_vendor_delivery_selections(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postStatefulJsonAsUser('/api/v1/checkout/preview', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [],
        ])->assertUnprocessable();
    }
}
