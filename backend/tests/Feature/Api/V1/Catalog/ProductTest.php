<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\RoleName;
use App\Enums\VendorAccountStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_public_can_list_active_products(): void
    {
        Product::factory()->count(3)->create();
        Product::factory()->archived()->create();

        $response = $this->getJson('/api/v1/products');

        $response->assertOk()
            ->assertJsonCount(3, 'data.items')
            ->assertJsonPath('data.pagination.total', 3);
    }

    public function test_public_can_show_product_with_related_products(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id, 'name' => 'Main Sofa']);
        Product::factory()->create(['category_id' => $category->id, 'name' => 'Related Chair']);

        $response = $this->getJson('/api/v1/products/'.$product->id);

        $response->assertOk()
            ->assertJsonPath('data.product.id', $product->id)
            ->assertJsonPath('data.product.name', 'Main Sofa')
            ->assertJsonCount(1, 'data.product.related_products')
            ->assertJsonPath('data.product.rating_avg', null)
            ->assertJsonPath('data.product.reviews_count', 0)
            ->assertJsonPath('data.product.likes_count', 0);
    }

    public function test_archived_product_is_hidden_from_public_show(): void
    {
        $product = Product::factory()->archived()->create();
        $product->delete();

        $this->getJson('/api/v1/products/'.$product->id)->assertNotFound();
    }

    public function test_inactive_vendor_products_are_hidden_from_public_list(): void
    {
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $vendor = $vendorUser->vendorAccount;
        $vendor->update(['status' => VendorAccountStatus::Suspended]);

        Product::factory()->create(['vendor_account_id' => $vendor->id]);
        Product::factory()->create();

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(1, 'data.items');
    }

    public function test_search_endpoint_returns_matching_products(): void
    {
        Product::factory()->create(['name' => 'Wooden Bed Frame']);
        Product::factory()->create(['name' => 'Metal Lamp']);

        $this->getJson('/api/v1/search?q=Bed')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.name', 'Wooden Bed Frame');
    }

    public function test_public_can_view_vendor_store_and_products(): void
    {
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $vendor = $vendorUser->vendorAccount;
        Product::factory()->count(2)->create(['vendor_account_id' => $vendor->id]);

        $this->getJson('/api/v1/vendors/'.$vendor->slug)
            ->assertOk()
            ->assertJsonPath('data.vendor.store_name', $vendor->business_name);

        $this->getJson('/api/v1/vendors/'.$vendor->slug.'/products')
            ->assertOk()
            ->assertJsonCount(2, 'data.items');
    }
}
