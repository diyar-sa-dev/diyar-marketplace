<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\VendorAccount;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PlatformDemoSeeder::class);
        $this->seed(CategorySeeder::class);
        $this->seed(CatalogSeeder::class);
        $this->seed(ServiceMarketplaceSeeder::class);
    }

    public function test_catalog_search_returns_products_and_services(): void
    {
        $this->getJson('/api/v1/catalog/search?q=كنب&type=all')
            ->assertOk()
            ->assertJsonPath('data.type', 'all')
            ->assertJsonPath('data.query', 'كنب')
            ->assertJsonStructure([
                'data' => [
                    'facets' => ['vendors', 'categories', 'colors'],
                    'products' => ['items', 'pagination'],
                    'services' => ['items', 'pagination'],
                ],
            ]);
    }

    public function test_catalog_search_filters_by_vendor_slug(): void
    {
        $vendor = VendorAccount::query()->where('slug', 'diyar-furniture')->firstOrFail();

        $this->getJson('/api/v1/catalog/search?q=كنب&vendor_slug='.$vendor->slug.'&type=products')
            ->assertOk()
            ->assertJsonPath('data.products.pagination.total', fn ($total) => $total > 0);

        foreach ($this->getJson('/api/v1/catalog/search?q=كنب&vendor_slug='.$vendor->slug.'&type=products')->json('data.products.items') as $item) {
            $this->assertSame('diyar-furniture', $item['vendor']['slug']);
        }
    }

    public function test_catalog_search_rejects_invalid_sort(): void
    {
        $this->getJson('/api/v1/catalog/search?q=test&sort=;drop table')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    public function test_catalog_search_rejects_excessive_per_page(): void
    {
        $this->getJson('/api/v1/catalog/search?q=test&per_page=500')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_catalog_search_returns_empty_products_for_no_match(): void
    {
        $this->getJson('/api/v1/catalog/search?q=xyzabc123&type=products')
            ->assertOk()
            ->assertJsonPath('data.products.pagination.total', 0)
            ->assertJsonCount(0, 'data.products.items');
    }

    public function test_catalog_search_supports_service_only_type(): void
    {
        $this->getJson('/api/v1/catalog/search?q=تصميم&type=services')
            ->assertOk()
            ->assertJsonMissingPath('data.products')
            ->assertJsonStructure([
                'data' => [
                    'services' => ['items', 'pagination'],
                ],
            ]);
    }

    public function test_catalog_search_vendor_facets_are_contextual(): void
    {
        $response = $this->getJson('/api/v1/catalog/search?q=كنب&type=products')->assertOk();
        $vendors = $response->json('data.facets.vendors');

        $this->assertNotEmpty($vendors);
        $this->assertLessThanOrEqual(20, count($vendors));
        $this->assertArrayHasKey('store_name', $vendors[0]);
        $this->assertArrayHasKey('product_count', $vendors[0]);
    }

    public function test_catalog_search_supports_discounted_sort_and_filter(): void
    {
        $this->getJson('/api/v1/catalog/search?type=products&discounted=1&sort=-discount')
            ->assertOk()
            ->assertJsonPath('data.products.pagination.total', fn ($total) => $total >= 0);
    }
}
