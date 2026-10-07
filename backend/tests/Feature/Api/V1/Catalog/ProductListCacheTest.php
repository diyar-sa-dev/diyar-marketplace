<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Domains\Catalog\Services\CatalogCacheInvalidator;
use App\Enums\RoleName;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductListCacheTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_guest_listing_cache_does_not_leak_authenticated_user_saved(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/products/'.$product->id.'/wishlist')
            ->assertOk();

        $this->app['auth']->forgetGuards();

        $guest = $this->getJson('/api/v1/products?per_page=10')->assertOk();
        $guestItem = collect($guest->json('data.items'))->firstWhere('id', $product->id);
        $this->assertNotNull($guestItem);
        $this->assertFalse($guestItem['user_saved'] ?? true);

        $authenticated = $this->actingAs($user)
            ->getJson('/api/v1/products?per_page=10')
            ->assertOk();

        $savedItem = collect($authenticated->json('data.items'))->firstWhere('id', $product->id);
        $this->assertNotNull($savedItem);
        $this->assertTrue($savedItem['user_saved'] ?? false);

        $this->app['auth']->forgetGuards();

        $guestCached = $this->getJson('/api/v1/products?per_page=10')->assertOk();
        $cachedItem = collect($guestCached->json('data.items'))->firstWhere('id', $product->id);
        $this->assertNotNull($cachedItem);
        $this->assertFalse($cachedItem['user_saved'] ?? true);
        $this->assertFalse($cachedItem['is_own_store'] ?? true);
    }

    public function test_catalog_version_bump_invalidates_guest_product_list_cache(): void
    {
        Product::factory()->create(['name' => 'First Chair']);

        $this->getJson('/api/v1/products?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1);

        Product::factory()->create(['name' => 'Second Chair']);

        $this->getJson('/api/v1/products?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1);

        app(CatalogCacheInvalidator::class)->invalidateSearchCaches();

        $this->getJson('/api/v1/products?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 2);
    }
}
