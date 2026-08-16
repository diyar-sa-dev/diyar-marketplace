<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_active_categories(): void
    {
        Category::factory()->create(['slug' => 'bedroom', 'name' => 'غرف النوم', 'sort_order' => 1]);
        Category::factory()->inactive()->create(['slug' => 'hidden', 'name' => 'Hidden']);

        $response = $this->getJson('/api/v1/categories');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.categories')
            ->assertJsonPath('data.categories.0.slug', 'bedroom');
    }

    public function test_public_can_show_active_category_by_slug(): void
    {
        $category = Category::factory()->create(['slug' => 'living-room', 'name' => 'الصالونات']);

        $this->getJson('/api/v1/categories/living-room')
            ->assertOk()
            ->assertJsonPath('data.category.slug', 'living-room')
            ->assertJsonPath('data.category.name', 'الصالونات');
    }

    public function test_inactive_category_returns_not_found(): void
    {
        Category::factory()->inactive()->create(['slug' => 'kitchen']);

        $this->getJson('/api/v1/categories/kitchen')->assertNotFound();
    }

    public function test_unknown_category_slug_returns_not_found(): void
    {
        $this->getJson('/api/v1/categories/unknown-slug')->assertNotFound();
    }

    public function test_category_items_returns_public_products(): void
    {
        $category = Category::factory()->create(['slug' => 'office']);
        Product::factory()->count(2)->create(['category_id' => $category->id]);
        Product::factory()->archived()->create(['category_id' => $category->id]);

        $response = $this->getJson('/api/v1/categories/office/items');

        $response->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.pagination.total', 2);
    }
}
