<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\InventoryMovementType;
use App\Enums\RoleName;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\Catalog\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class InventoryAdjustmentTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    private InventoryService $inventory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inventory = app(InventoryService::class);
    }

    public function test_vendor_can_increase_stock_via_api(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Increase->value,
            'quantity' => 5,
            'note' => 'Restock',
        ])->assertOk()
            ->assertJsonPath('data.product.inventory.stock_quantity', 15);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Increase->value,
            'quantity' => 5,
            'previous_stock_quantity' => 10,
            'resulting_stock_quantity' => 15,
            'created_by' => $vendor->id,
        ]);
    }

    public function test_vendor_can_decrease_stock(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Decrease->value,
            'quantity' => 3,
        ])->assertOk()
            ->assertJsonPath('data.product.inventory.stock_quantity', 7);
    }

    public function test_vendor_can_set_absolute_stock_with_adjustment(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Adjustment->value,
            'quantity' => 25,
        ])->assertOk()
            ->assertJsonPath('data.product.inventory.stock_quantity', 25);
    }

    public function test_zero_adjustment_is_allowed_without_movement(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Adjustment->value,
            'quantity' => 10,
        ])->assertOk()
            ->assertJsonPath('data.product.inventory.stock_quantity', 10);

        $movementCount = InventoryMovement::query()->where('product_id', $product->id)->count();

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Adjustment->value,
            'quantity' => 10,
        ])->assertOk();

        $this->assertSame($movementCount, InventoryMovement::query()->where('product_id', $product->id)->count());
    }

    public function test_decrease_cannot_make_stock_negative(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Decrease->value,
            'quantity' => 20,
        ])->assertStatus(422);
    }

    public function test_vendor_cannot_adjust_another_vendors_inventory(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $owner->vendorAccount->id]);

        $this->actingAs($intruder)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Increase->value,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_service_layer_records_audit_fields(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'category_id' => $category->id,
        ]);

        $this->inventory->adjust($product, $vendor, [
            'type' => InventoryMovementType::Decrease->value,
            'quantity' => 4,
            'note' => 'Damaged units',
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Decrease->value,
            'quantity' => -4,
            'previous_stock_quantity' => 10,
            'resulting_stock_quantity' => 6,
            'note' => 'Damaged units',
        ]);
    }

    public function test_invalid_quantity_is_rejected(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->expectException(InvalidArgumentException::class);
        $this->inventory->adjust($product, $vendor, [
            'type' => InventoryMovementType::Increase->value,
            'quantity' => 0,
        ]);
    }
}
