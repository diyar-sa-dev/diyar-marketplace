<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\RoleName;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductPreorderTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_customer_can_submit_preorder_for_preorder_product(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = User::factory()->create();
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'status' => ProductStatus::Active,
            'availability_mode' => AvailabilityMode::Preorder,
            'sale_price' => '1750.00',
        ]);

        $response = $this->actingAs($customer)->postJson("/api/v1/products/{$product->id}/preorder", [
            'selected_color' => ['name' => 'Beige', 'hex_code' => '#F5F5DC'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.preorder.status', 'pending')
            ->assertJsonPath('data.preorder.unit_price', '1750.00');

        $this->assertDatabaseHas('product_preorder_requests', [
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'vendor_account_id' => $vendor->vendorAccount->id,
            'status' => 'pending',
        ]);
    }

    public function test_vendor_can_list_pending_preorders(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $customer = User::factory()->create();
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'status' => ProductStatus::Active,
            'availability_mode' => AvailabilityMode::Preorder,
        ]);

        $this->actingAs($customer)->postJson("/api/v1/products/{$product->id}/preorder")->assertCreated();

        $response = $this->actingAs($vendor)->getJson('/api/v1/dashboard/vendor/preorders');

        $response->assertOk()
            ->assertJsonPath('data.summary.pending', 1)
            ->assertJsonCount(1, 'data.items');
    }

    public function test_in_stock_product_rejects_preorder_request(): void
    {
        $customer = User::factory()->create();
        $product = Product::factory()->create([
            'status' => ProductStatus::Active,
            'availability_mode' => AvailabilityMode::InStock,
        ]);

        $this->actingAs($customer)
            ->postJson("/api/v1/products/{$product->id}/preorder")
            ->assertStatus(422);
    }
}
