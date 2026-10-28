<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\RoleName;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CategoryAdminTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    public function test_admin_can_manage_categories(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $createResponse = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/categories', [
            'name' => 'New Category',
            'slug' => 'new-category',
            'sort_order' => 5,
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.category.slug', 'new-category');

        $categoryId = $createResponse->json('data.category.id');

        $this->actingAs($admin, 'admin')->getJson('/api/v1/admin/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data.categories');

        $this->actingAs($admin, 'admin')->patchJson('/api/v1/admin/categories/'.$categoryId, [
            'name' => 'Renamed Category',
        ])->assertOk()
            ->assertJsonPath('data.category.name', 'Renamed Category');

        $this->actingAs($admin, 'admin')->deleteJson('/api/v1/admin/categories/'.$categoryId)
            ->assertOk();

        $this->assertDatabaseMissing('categories', ['id' => $categoryId]);
    }

    public function test_non_admin_cannot_manage_categories(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $category = Category::factory()->create();

        $this->actingAs($vendor)->getJson('/api/v1/admin/categories')->assertUnauthorized();
        $this->actingAs($vendor)->postJson('/api/v1/admin/categories', [
            'name' => 'Blocked',
        ])->assertUnauthorized();
        $this->actingAs($vendor)->patchJson('/api/v1/admin/categories/'.$category->id, [
            'name' => 'Blocked',
        ])->assertUnauthorized();
        $this->actingAs($vendor)->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertUnauthorized();
    }

    public function test_admin_cannot_delete_category_with_products(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id]);

        $this->actingAs($admin, 'admin')->deleteJson('/api/v1/admin/categories/'.$category->id)
            ->assertStatus(422);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_category_mutations_record_admin_audit_logs(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $createResponse = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/categories', [
            'name' => 'Audited Category',
            'slug' => 'audited-category',
            'sort_order' => 1,
        ])->assertCreated();

        $categoryId = $createResponse->json('data.category.id');

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'category.create',
            'resource_type' => Category::class,
            'resource_id' => $categoryId,
            'actor_id' => $admin->id,
        ]);

        $this->actingAs($admin, 'admin')->patchJson('/api/v1/admin/categories/'.$categoryId, [
            'name' => 'Audited Category Updated',
        ])->assertOk();

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'category.update',
            'resource_id' => $categoryId,
            'actor_id' => $admin->id,
        ]);

        $this->actingAs($admin, 'admin')->deleteJson('/api/v1/admin/categories/'.$categoryId)
            ->assertOk();

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'category.delete',
            'resource_id' => $categoryId,
            'actor_id' => $admin->id,
        ]);

        $this->actingAs($admin, 'admin')->getJson('/api/v1/admin/audit-logs?action=category.create')
            ->assertOk()
            ->assertJsonPath('data.audit_logs.0.action', 'category.create');
    }

    public function test_unauthenticated_admin_routes_are_rejected(): void
    {
        $category = Category::factory()->create();

        $this->getJson('/api/v1/admin/categories')->assertUnauthorized();
        $this->postJson('/api/v1/admin/categories', ['name' => 'Test'])->assertUnauthorized();
        $this->deleteJson('/api/v1/admin/categories/'.$category->id)->assertUnauthorized();
    }

    public function test_admin_can_upload_and_delete_category_image(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $category = Category::factory()->create();

        // 100x100 PNG sample with sufficient byte weight to ensure WebP compression yields lower byte count
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB9ElEQVR4nO3Qa2sNAACA4dOSliQtaS0tSVqSJK21JEmSJGktLWnpJC1JS1paa0lLkiStpZmZ2WabmZltZmabbba5bNiwYe6GMZdh2IW/sPf7+/yEJxD4Fwxo8kIm/CKmjPtFTB3ziwgd9YuY9tcvYvofv4gZv/0iZo74RYT98ouY9dMvYvYPv4jwYb+IiO9+EXO++UVEfvWLmPvFL2LekF/E/M9+EQs++UVEDfpFLPzoF7Hog1/E4vd+EUsG/CKWvvOLWPbWLyL6jV9EzGu/iNhXfhHLX/pFrHjhF7HyuV/Eqn6/iNXP/CLWPPWLWPvEL2Jdn1/E+l6/iA2P/SI2PvKL2PTQLyKuxy8ivtsvYvMDv4iE+34RW+75RWzt8otI7PSL2HbXLyJ4xy9i+22/iB23/CKSOvwidrb7Rexq84vYfdMvIrnVL2JPi1/E3ma/iJQbfhH7mvwiUhv9ItIa/CLSr/tF7K/3izhwzS8io84v4uBVv4hDtX4Rh6/4RRyp8Ys4Wu0XcazKL+L4Zb+IzEq/iKxLfhEnKvwisi/6ReSU+0XkXvCLyCvzi8g/7xdRUOoXUVTiF1Fc7BdRes4voqzIL6K80C+iosAvovKsX0RVvl9EzRm/iNo8v4i6034R9bl+EQ2n/CKacvwimk/6RbRmB/8DHBueA2+bBFQAAAAASUVORK5CYII=',
            true,
        );
        $tmp = tempnam(sys_get_temp_dir(), 'category');
        file_put_contents($tmp, (string) $png);

        $upload = $this->actingAs($admin, 'admin')->postJson(
            '/api/v1/admin/categories/'.$category->id.'/image',
            ['image' => new UploadedFile($tmp, 'category.png', 'image/png', null, true)],
        );

        $upload->assertOk()
            ->assertJsonPath('data.category.id', $category->id);

        $this->assertNotNull($upload->json('data.category.image_url'));
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
        ]);
        $this->assertNotNull(Category::query()->find($category->id)?->image_path);
        if (extension_loaded('gd') && function_exists('imagewebp')) {
            $this->assertStringEndsWith('.webp', (string) Category::query()->find($category->id)?->image_path);
        }

        $this->actingAs($admin, 'admin')
            ->deleteJson('/api/v1/admin/categories/'.$category->id.'/image')
            ->assertOk()
            ->assertJsonPath('data.category.image_url', null);

        $this->assertNull(Category::query()->find($category->id)?->image_path);
    }
}
