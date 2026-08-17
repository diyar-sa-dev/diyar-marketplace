<?php

namespace Tests\Feature\Api\V1\Shipping;

use App\Enums\RoleName;
use App\Models\Product;
use App\Models\VendorOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class VendorOrderFulfillmentTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithIdentity, RefreshDatabase;

    public function test_vendor_can_progress_order_through_fulfillment_lifecycle(): void
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

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)
            ->assertOk()
            ->assertJsonPath('data.vendor_order.status', 'accepted');

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)
            ->assertOk()
            ->assertJsonPath('data.vendor_order.status', 'processing')
            ->assertJsonPath('data.vendor_order.shipment.status', 'prepared');

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'TRK-123456',
            'carrier' => 'SMSA',
        ])->assertOk()
            ->assertJsonPath('data.vendor_order.status', 'shipped')
            ->assertJsonPath('data.vendor_order.shipment.tracking_number', 'TRK-123456')
            ->assertJsonPath('data.vendor_order.shipment.carrier', 'SMSA');

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)
            ->assertOk()
            ->assertJsonPath('data.vendor_order.status', 'delivered')
            ->assertJsonPath('data.vendor_order.shipment.status', 'delivered');
    }

    public function test_ship_requires_tracking_number(): void
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
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor);

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => '',
        ])->assertUnprocessable();
    }

    public function test_vendor_cannot_fulfill_another_vendors_order(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $product = Product::factory()->create(['vendor_account_id' => $vendorA->vendorAccount->id]);
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

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendorB)
            ->assertForbidden();
    }

    public function test_invalid_status_transition_is_rejected(): void
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

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'TRK-000',
        ])->assertStatus(422);
    }
}
