<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\RoleName;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CategoryAdminTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_admin_can_manage_categories(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $createResponse = $this->actingAs($admin)->postJson('/api/v1/admin/categories', [
            'name' => 'New Category',
            'slug' => 'new-category',
            'sort_order' => 5,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.category.slug', 'new-category');

        $categoryId = $createResponse->json('data.category.id');

        $this->actingAs($admin)->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data.categories');

        $this->actingAs($admin)->patchJson('/api/v1/admin/categories/'.$categoryId, [
            'name' => 'Renamed Category',
        ])->assertOk()
            ->assertJsonPath('data.category.name', 'Renamed Category');

        $this->actingAs($admin)->deleteJson('/api/v1/admin/categories/'.$categoryId)
            ->assertOk();

        $this->assertDatabaseMissing('categories', ['id' => $categoryId]);
    }

    public function test_non_admin_cannot_manage_categories(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $category = Category::factory()->create();

        $this->actingAs($vendor)->getJson('/api/v1/admin/categories')->assertForbidden();
        $this->actingAs($vendor)->postJson('/api/v1/admin/categories', [
            'name' => 'Blocked',
        ])->assertForbidden();
        $this->actingAs($vendor)->patchJson('/api/v1/admin/categories/'.$category->id, [
            'name' => 'Blocked',
        ])->assertForbidden();
        $this->actingAs($vendor)->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertForbidden();
    }

    public function test_admin_cannot_delete_category_with_products(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id]);

        $this->actingAs($admin)->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertStatus(422);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_unauthenticated_admin_routes_are_rejected(): void
    {
        $category = Category::factory()->create();

        $this->getJson('/api/v1/admin/categories')->assertUnauthorized();
        $this->postJson('/api/v1/admin/categories', ['name' => 'Test'])->assertUnauthorized();
        $this->deleteJson('/api/v1/admin/categories/'.$category->id)->assertUnauthorized();
    }
}
