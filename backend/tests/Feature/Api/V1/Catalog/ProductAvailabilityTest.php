<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\AvailabilityMode;
use App\Enums\InventoryMovementType;
use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductAvailabilityTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_vendor_can_set_preorder_with_expected_date(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);
        $expectedDate = now()->addWeek()->toDateString();

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/products/'.$product->id, [
            'availability_mode' => AvailabilityMode::Preorder->value,
            'expected_available_at' => $expectedDate,
        ])->assertOk()
            ->assertJsonPath('data.product.availability_mode', AvailabilityMode::Preorder->value)
            ->assertJsonPath('data.product.expected_available_at', $expectedDate);
    }

    public function test_public_product_detail_exposes_preorder_state(): void
    {
        $product = Product::factory()->create([
            'availability_mode' => AvailabilityMode::Preorder,
            'expected_available_at' => now()->addDays(10)->toDateString(),
        ]);

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.availability_mode', AvailabilityMode::Preorder->value)
            ->assertJsonPath('data.product.expected_available_at', $product->expected_available_at->toDateString());
    }

    public function test_out_of_stock_product_detail_exposes_availability_mode(): void
    {
        $product = Product::factory()->outOfStock()->create();
        $product->inventory->update([
            'stock_quantity' => 0,
            'reserved_quantity' => 0,
            'available_quantity' => 0,
        ]);

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.availability_mode', AvailabilityMode::OutOfStock->value)
            ->assertJsonPath('data.product.inventory.available_quantity', 0);
    }

    public function test_unauthorized_user_cannot_change_product_availability(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $owner->vendorAccount->id]);

        $this->actingAs($intruder)->patchJson('/api/v1/dashboard/vendor/products/'.$product->id, [
            'availability_mode' => AvailabilityMode::Preorder->value,
        ])->assertForbidden();
    }

    public function test_inventory_depletion_auto_sets_out_of_stock(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Decrease->value,
            'quantity' => 10,
        ])->assertOk()
            ->assertJsonPath('data.product.inventory.stock_quantity', 0)
            ->assertJsonPath('data.product.inventory.available_quantity', 0)
            ->assertJsonPath('data.product.availability_mode', AvailabilityMode::OutOfStock->value);
    }
}
