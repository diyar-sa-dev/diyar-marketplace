<?php

namespace Tests\Feature\Api\V1\Order;

use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ManualOrderApiDisabledTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_manual_vendor_order_api_is_disabled_by_default(): void
    {
        config(['diyar.manual_orders.api_enabled' => false]);

        $vendor = $this->createUserWithRole(RoleName::Vendor);
        Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/orders', $vendor, [
            'customer_name' => 'Walk-in Customer',
            'customer_phone' => '+966500000000',
            'vendor_total' => '100.00',
            'items_count' => 1,
            'status' => 'pending',
            'payment_status' => 'paid',
        ])->assertForbidden()
            ->assertJsonPath('message', __('diyar.order.manual_orders_disabled'));
    }
}
