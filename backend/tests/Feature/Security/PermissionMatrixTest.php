<?php

namespace Tests\Feature\Security;

use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

/**
 * Executable permission matrix for critical API boundaries.
 */
class PermissionMatrixTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_customer_cannot_access_vendor_dashboard(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/overview', $customer)->assertForbidden();
        $this->getJsonAsUser('/api/v1/dashboard/vendor/products', $customer)->assertForbidden();
    }

    public function test_customer_cannot_access_admin_panel(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser('/api/v1/admin/dashboard', $customer)->assertUnauthorized();
        $this->getJsonAsUser('/api/v1/admin/users', $customer)->assertUnauthorized();
    }

    public function test_vendor_cannot_access_admin_panel(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->getJsonAsUser('/api/v1/admin/dashboard', $vendor)->assertUnauthorized();
    }

    public function test_vendor_cannot_access_other_vendor_products(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $productB = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
        ]);

        $response = $this->getJsonAsUser('/api/v1/dashboard/vendor/products/'.$productB->id, $vendorA);
        $this->assertContains($response->status(), [403, 404]);
    }

    public function test_provider_cannot_access_vendor_orders(): void
    {
        $provider = $this->createUserWithRole(RoleName::Provider);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/orders', $provider)->assertForbidden();
    }

    public function test_affiliate_cannot_access_admin_finance(): void
    {
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->getJsonAsUser('/api/v1/admin/finance/summary', $marketer)->assertUnauthorized();
    }

    public function test_customer_cannot_view_other_customer_order(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($owner);
        $this->addProductToUserCart($owner, $product);

        $orderId = $this->postJsonAsUser(
            '/api/v1/orders',
            $owner,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated()->json('data.order.id');

        $this->getJsonAsUser('/api/v1/orders/'.$orderId, $other)->assertForbidden();
    }

    public function test_admin_can_view_any_order(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create(['sale_price' => 100.00]);
        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderId = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated()->json('data.order.id');

        $this->getJsonAsAdmin('/api/v1/admin/orders/'.$orderId, $admin)->assertOk();
    }

    public function test_public_catalog_is_accessible_to_guest(): void
    {
        $this->getJson('/api/v1/products?per_page=1')->assertOk();
        $this->getJson('/api/v1/storefront/home')->assertOk();
        $this->getJson('/api/v1/categories?type=product')->assertOk();
    }
}
