<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Product;
use App\Models\ProductInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_available_quantity_matches_stock_minus_reserved(): void
    {
        $product = Product::factory()->create();
        $inventory = ProductInventory::query()->where('product_id', $product->id)->firstOrFail();

        $inventory->update([
            'stock_quantity' => 20,
            'reserved_quantity' => 7,
        ]);
        $inventory->syncAvailableQuantity();

        $inventory->refresh();
        $this->assertSame(13, $inventory->available_quantity);
        $inventory->assertInvariants();
    }

    public function test_available_quantity_never_goes_negative(): void
    {
        $product = Product::factory()->create();
        $inventory = $product->inventory;
        $inventory->update([
            'stock_quantity' => 5,
            'reserved_quantity' => 5,
            'available_quantity' => 10,
        ]);

        $inventory->syncAvailableQuantity();

        $this->assertSame(0, $inventory->fresh()->available_quantity);
        $inventory->fresh()->assertInvariants();
    }

    public function test_invariant_detects_over_reservation(): void
    {
        $product = Product::factory()->create();
        $inventory = $product->inventory;
        $inventory->update([
            'stock_quantity' => 5,
            'reserved_quantity' => 6,
            'available_quantity' => 0,
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $inventory->assertInvariants();
    }

    public function test_product_has_one_inventory_record(): void
    {
        $product = Product::factory()->create();

        $this->assertNotNull($product->inventory);
        $this->assertSame(1, ProductInventory::query()->where('product_id', $product->id)->count());
    }
}
