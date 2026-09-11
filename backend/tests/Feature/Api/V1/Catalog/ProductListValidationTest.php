<?php

namespace Tests\Feature\Api\V1\Catalog;

use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductListValidationTest extends TestCase
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

    #[Test]
    public function products_reject_invalid_sort_values(): void
    {
        $this->getJson('/api/v1/products?sort=;drop table products')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    #[Test]
    public function products_reject_excessive_per_page(): void
    {
        $this->getJson('/api/v1/products?per_page=500')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    #[Test]
    public function legacy_search_endpoint_rejects_invalid_sort_values(): void
    {
        $this->getJson('/api/v1/search?sort=not-a-real-sort')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }
}
