<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\RoleName;
use App\Jobs\Analytics\RecordAnalyticsEventJob;
use App\Models\Category;
use App\Models\Product;
use App\Services\Catalog\CatalogCacheInvalidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductDetailCacheTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    public function test_guest_detail_cache_does_not_leak_authenticated_user_saved(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/products/'.$product->id.'/wishlist')
            ->assertOk();

        $this->app['auth']->forgetGuards();

        $guest = $this->getJson('/api/v1/products/'.$product->id)->assertOk();
        $this->assertFalse($guest->json('data.product.user_saved') ?? true);
        $this->assertFalse($guest->json('data.product.user_liked') ?? true);
        $this->assertFalse($guest->json('data.product.is_own_store') ?? true);

        $authenticated = $this->actingAs($user)
            ->getJson('/api/v1/products/'.$product->id)
            ->assertOk();

        $this->assertTrue($authenticated->json('data.product.user_saved') ?? false);

        $this->app['auth']->forgetGuards();

        $guestCached = $this->getJson('/api/v1/products/'.$product->id)->assertOk();
        $this->assertFalse($guestCached->json('data.product.user_saved') ?? true);
        $this->assertFalse($guestCached->json('data.product.user_liked') ?? true);
        $this->assertFalse($guestCached->json('data.product.is_own_store') ?? true);
        $this->assertArrayNotHasKey('sales_stats', $guestCached->json('data.product'));
    }

    public function test_catalog_version_bump_invalidates_guest_product_detail_cache(): void
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Main Sofa',
        ]);

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonCount(0, 'data.product.related_products');

        Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Related Chair',
        ]);

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonCount(0, 'data.product.related_products');

        app(CatalogCacheInvalidator::class)->invalidateSearchCaches();

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonCount(1, 'data.product.related_products')
            ->assertJsonPath('data.product.related_products.0.name', 'Related Chair');
    }

    public function test_guest_detail_cache_hit_still_dispatches_analytics_job(): void
    {
        Queue::fake();

        $product = Product::factory()->create();

        $this->getJson('/api/v1/products/'.$product->id)->assertOk();
        $this->getJson('/api/v1/products/'.$product->id)->assertOk();

        Queue::assertPushed(RecordAnalyticsEventJob::class, 1);
    }

    public function test_authenticated_detail_reuses_public_cache_without_product_table_queries(): void
    {
        $userA = $this->createUserWithRole(RoleName::Customer);
        $userB = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->getJson('/api/v1/products/'.$product->id)->assertOk();

        $this->actingAs($userA)
            ->postJson('/api/v1/products/'.$product->id.'/wishlist')
            ->assertOk();

        $this->actingAs($userA)
            ->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.user_saved', true);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->actingAs($userB)
            ->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.user_saved', false);

        $productTableQueries = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                return str_contains($sql, 'from "products"')
                    || str_contains($sql, 'from products')
                    || str_contains($sql, 'from "product_images"')
                    || str_contains($sql, 'from "product_inventory"');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $productTableQueries,
            'Authenticated detail should overlay onto cached public body without reloading product rows.',
        );
    }

    public function test_archiving_product_invalidates_guest_detail_cache(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->getJson('/api/v1/products/'.$product->id)->assertOk();

        $this->actingAs($vendor)
            ->deleteJson('/api/v1/dashboard/vendor/products/'.$product->id)
            ->assertOk();

        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/products/'.$product->id)->assertNotFound();
    }
}
