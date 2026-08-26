<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\RoleName;
use App\Models\ShippingCarrier;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminShippingSecurityTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_marketplace_customer_cannot_access_shipping_carriers(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $this->actingAs($customer, 'web');

        $this->getJson('/api/v1/admin/shipping/carriers')->assertUnauthorized();
    }

    public function test_marketplace_vendor_cannot_create_shipping_carrier(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $this->actingAs($vendor, 'web');

        $this->postJson('/api/v1/admin/shipping/carriers', [
            'code' => 'evil',
            'name' => 'Evil Carrier',
        ])->assertUnauthorized();
    }

    public function test_admin_with_permission_can_list_shipping_carriers(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $this->actingAsAdmin($admin);

        ShippingCarrier::query()->create([
            'code' => 'allowed',
            'name' => 'Allowed Carrier',
            'is_active' => true,
        ]);

        $this->getJson('/api/v1/admin/shipping/carriers')->assertOk();
    }
}
