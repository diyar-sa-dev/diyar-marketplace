<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\PaymentStatus;
use App\Enums\RoleName;
use App\Models\Product;
use App\Models\VendorOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorManualOrderTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.manual_orders.api_enabled' => true]);
    }

    public function test_vendor_can_create_manual_order(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $response = $this->postJsonAsUser('/api/v1/dashboard/vendor/orders', $vendor, [
            'customer_name' => 'Mohammed Ahmed',
            'vendor_total' => '1500.00',
            'items_count' => 2,
            'status' => 'pending',
            'payment_status' => PaymentStatus::Paid->value,
            'customer_phone' => '+966501234567',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.vendor_order.customer_name', 'Mohammed Ahmed')
            ->assertJsonPath('data.vendor_order.vendor_total', '1500.00')
            ->assertJsonPath('data.vendor_order.payment_status', 'paid');

        $vendorOrderId = $response->json('data.vendor_order.id');
        $vendorOrder = VendorOrder::query()->with('items')->findOrFail($vendorOrderId);

        $this->assertCount(2, $vendorOrder->items);
        $this->assertSame('1500.00', $vendorOrder->vendor_total);
        $this->assertSame('0.00', $vendorOrder->shipping_cost);
    }

    public function test_vendor_orders_index_supports_search_and_status_filters(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);
        $this->createVendorShippingSettings($product->vendorAccount);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $this->getJsonAsUser('/api/v1/dashboard/vendor/orders?status=pending', $vendor)
            ->assertOk()
            ->assertJsonStructure(['data' => ['vendor_orders', 'pagination']]);
    }
}
