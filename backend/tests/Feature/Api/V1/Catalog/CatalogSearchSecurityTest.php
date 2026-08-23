<?php

namespace Tests\Feature\Api\V1\Catalog;

use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogSearchSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(PlatformDemoSeeder::class);
        $this->seed(CategorySeeder::class);
        $this->seed(CatalogSeeder::class);
    }

    public function test_catalog_search_is_public_without_authentication(): void
    {
        $response = $this->getJson('/api/v1/catalog/search?q=كنب&type=products&per_page=5');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'facets',
                    'products' => ['items', 'pagination'],
                ],
            ]);
    }

    public function test_catalog_search_does_not_expose_internal_product_fields(): void
    {
        $response = $this->getJson('/api/v1/catalog/search?q=كنب&type=products&per_page=1');

        $response->assertOk();

        $items = $response->json('data.products.items') ?? [];
        if ($items === []) {
            $this->markTestSkipped('No seeded products matched search query.');
        }

        $product = $items[0];
        $this->assertArrayNotHasKey('vendor_account_id', $product);
        $this->assertArrayNotHasKey('deleted_at', $product);
        $this->assertArrayNotHasKey('internal_notes', $product);
    }

    public function test_catalog_search_suggestions_are_public(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/suggestions?q=كنب');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'query',
                    'suggestions',
                ],
            ]);
    }

    public function test_catalog_search_rejects_overlong_query(): void
    {
        $response = $this->getJson('/api/v1/catalog/search?q='.str_repeat('ا', 150));

        $response->assertStatus(422);
    }
}
