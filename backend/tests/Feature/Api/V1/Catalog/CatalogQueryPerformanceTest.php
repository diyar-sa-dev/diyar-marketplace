<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CatalogQueryPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_list_avoids_per_card_review_fallback_queries(): void
    {
        Product::factory()->count(8)->create();

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/products?per_page=8')
            ->assertOk()
            ->assertJsonCount(8, 'data.items');

        $perCardFallbackQueries = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                if (! str_contains($sql, 'product_reviews') || ! str_contains($sql, 'product_id')) {
                    return false;
                }

                return str_starts_with(ltrim($sql), 'select count(*)')
                    || str_contains($sql, 'avg("rating")');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $perCardFallbackQueries,
            'Product cards should not trigger per-card review count/avg fallback queries.',
        );
    }

    public function test_anonymous_product_list_does_not_requery_products_on_cache_hit(): void
    {
        Product::factory()->count(8)->create();

        $this->getJson('/api/v1/products?per_page=8')
            ->assertOk()
            ->assertJsonCount(8, 'data.items');

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/products?per_page=8')
            ->assertOk()
            ->assertJsonCount(8, 'data.items')
            ->assertJsonPath('data.pagination.total', 8);

        $productTableQueries = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                return str_contains($sql, 'from "products"')
                    || str_contains($sql, 'from products')
                    || str_contains($sql, 'from "product_inventory"')
                    || str_contains($sql, 'from "product_images"');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $productTableQueries,
            'Anonymous GET /products should be served from catalog cache on the second request.',
        );
    }

    public function test_product_detail_does_not_probe_schema_when_aggregates_are_eager_loaded(): void
    {
        $category = Category::factory()->create();
        Product::factory()->count(2)->create(['category_id' => $category->id]);
        $product = Product::query()->where('category_id', $category->id)->firstOrFail();

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.id', $product->id);

        $schemaProbes = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                return str_contains($sql, 'information_schema')
                    || str_contains($sql, 'sqlite_master')
                    || str_contains($sql, 'schema()');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $schemaProbes,
            'Product detail should not probe information_schema when likes/reviews aggregates are already loaded.',
        );
    }

    public function test_anonymous_product_detail_does_not_requery_products_on_cache_hit(): void
    {
        $product = Product::factory()->create();

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.id', $product->id);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/products/'.$product->id)
            ->assertOk()
            ->assertJsonPath('data.product.id', $product->id)
            ->assertJsonPath('data.product.user_saved', false);

        $productTableQueries = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                return str_contains($sql, 'from "products"')
                    || str_contains($sql, 'from products')
                    || str_contains($sql, 'from "product_inventory"')
                    || str_contains($sql, 'from "product_images"')
                    || str_contains($sql, 'from "product_likes"')
                    || str_contains($sql, 'from "product_reviews"');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $productTableQueries,
            'Anonymous GET /products/{id} should be served from catalog cache on the second request.',
        );
    }

    public function test_anonymous_catalog_search_does_not_requery_products_on_cache_hit(): void
    {
        Product::factory()->create(['name' => 'Searchable Sofa']);

        $this->getJson('/api/v1/catalog/search?q=Sofa&type=products&per_page=8')
            ->assertOk();

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/catalog/search?q=Sofa&type=products&per_page=8')
            ->assertOk()
            ->assertJsonPath('data.type', 'products');

        $productTableQueries = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                return str_contains($sql, 'from "products"')
                    || str_contains($sql, 'from products')
                    || str_contains($sql, 'from "product_inventory"')
                    || str_contains($sql, 'from "product_images"');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $productTableQueries,
            'Anonymous catalog search should be served from catalog cache on the second request.',
        );
    }
}
