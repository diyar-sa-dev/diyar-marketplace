<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\InventoryMovementType;
use App\Enums\RoleName;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductIdorTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_vendor_can_create_and_manage_own_product(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $category = Category::factory()->create();

        $createResponse = $this->actingAs($vendor)->postJson('/api/v1/dashboard/vendor/products', [
            'category_id' => $category->id,
            'name' => 'Vendor Product',
            'description' => 'Owned product',
            'sale_price' => 999.99,
            'stock_quantity' => 5,
            'colors' => [
                ['name' => 'White', 'hex_code' => '#FFFFFF'],
            ],
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.product.name', 'Vendor Product');

        $productId = $createResponse->json('data.product.id');

        $this->actingAs($vendor)->getJson('/api/v1/dashboard/vendor/products/'.$productId)
            ->assertOk();

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/products/'.$productId, [
            'name' => 'Updated Vendor Product',
        ])->assertOk()
            ->assertJsonPath('data.product.name', 'Updated Vendor Product');

        $this->actingAs($vendor)->patchJson('/api/v1/dashboard/vendor/inventory/'.$productId, [
            'type' => InventoryMovementType::Increase->value,
            'quantity' => 3,
            'note' => 'Restock',
        ])->assertOk()
            ->assertJsonPath('data.product.inventory.stock_quantity', 8);
    }

    public function test_vendor_cannot_modify_another_vendors_product(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Vendor);
        $category = Category::factory()->create();

        $product = Product::factory()->create([
            'vendor_account_id' => $owner->vendorAccount->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($intruder)->getJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertForbidden();

        $this->actingAs($intruder)->patchJson('/api/v1/dashboard/vendor/products/'.$product->id, [
            'name' => 'Hacked',
        ])->assertForbidden();

        $this->actingAs($intruder)->deleteJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertForbidden();

        $this->actingAs($intruder)->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Decrease->value,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_vendor_cannot_delete_another_vendors_product_image(): void
    {
        $owner = $this->createUserWithRole(RoleName::Vendor);
        $intruder = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $owner->vendorAccount->id]);

        $this->actingAs($intruder)->deleteJson('/api/v1/dashboard/vendor/products/'.$product->id.'/images/'.(string) str()->uuid())
            ->assertForbidden();
    }

    public function test_create_product_rejects_foreign_vendor_account_id(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $otherVendor = $this->createUserWithRole(RoleName::Vendor);
        $category = Category::factory()->create();

        $this->actingAs($vendor)->postJson('/api/v1/dashboard/vendor/products', [
            'category_id' => $category->id,
            'name' => 'Bad Product',
            'sale_price' => 100,
            'stock_quantity' => 1,
            'vendor_account_id' => $otherVendor->vendorAccount->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['vendor_account_id']);
    }

    public function test_unauthenticated_dashboard_access_is_rejected(): void
    {
        $product = Product::factory()->create();

        $this->getJson('/api/v1/dashboard/vendor/products')->assertUnauthorized();
        $this->postJson('/api/v1/dashboard/vendor/products', [])->assertUnauthorized();
        $this->patchJson('/api/v1/dashboard/vendor/inventory/'.$product->id, [
            'type' => InventoryMovementType::Increase->value,
            'quantity' => 1,
        ])->assertUnauthorized();
    }

    public function test_archived_product_is_hidden_from_public_but_still_owned_by_vendor(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->actingAs($vendor)->deleteJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertOk();

        $this->getJson('/api/v1/products/'.$product->id)->assertNotFound();

        $this->actingAs($vendor)->getJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertOk();
    }
}
