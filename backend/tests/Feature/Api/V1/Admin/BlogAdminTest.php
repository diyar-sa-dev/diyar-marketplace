<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\BlogArticleStatus;
use App\Enums\RoleName;
use App\Models\BlogArticle;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class BlogAdminTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    #[Test]
    public function admin_can_manage_blog_content(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $categoryResponse = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/categories', [
            'name' => 'Admin Category',
            'slug' => 'admin-category',
        ])->assertCreated();

        $categoryId = $categoryResponse->json('data.category.id');

        $tagResponse = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/tags', [
            'name' => 'Admin Tag',
            'slug' => 'admin-tag',
        ])->assertCreated();

        $tagId = $tagResponse->json('data.tag.id');

        $articleResponse = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/articles', [
            'blog_category_id' => $categoryId,
            'title' => 'Admin Article',
            'content' => '<p>Hello <script>alert(1)</script> world</p>',
            'author_name' => 'Admin Writer',
            'tag_ids' => [$tagId],
        ])->assertCreated()
            ->assertJsonPath('data.article.status', BlogArticleStatus::Draft->value);

        $articleId = $articleResponse->json('data.article.id');
        $this->assertStringNotContainsString('<script>', $articleResponse->json('data.article.content'));

        $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/articles/'.$articleId.'/publish')
            ->assertOk()
            ->assertJsonPath('data.article.status', BlogArticleStatus::Published->value);

        $this->getJson('/api/v1/blog/articles/'.$articleResponse->json('data.article.slug'))
            ->assertOk()
            ->assertJsonPath('data.article.title', 'Admin Article');

        $this->actingAs($admin, 'admin')->patchJson('/api/v1/admin/blog/articles/'.$articleId, [
            'title' => 'Updated Admin Article',
        ])->assertOk()
            ->assertJsonPath('data.article.title', 'Updated Admin Article');

        $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/articles/'.$articleId.'/archive')
            ->assertOk()
            ->assertJsonPath('data.article.status', BlogArticleStatus::Archived->value);

        $this->getJson('/api/v1/blog/articles/'.$articleResponse->json('data.article.slug'))
            ->assertNotFound();

        $this->actingAs($admin, 'admin')->deleteJson('/api/v1/admin/blog/articles/'.$articleId)
            ->assertOk();

        $this->assertSoftDeleted('blog_articles', ['id' => $articleId]);
    }

    #[Test]
    public function admin_cannot_delete_category_with_articles(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        $category = BlogCategory::query()->create([
            'name' => 'Protected Category',
            'slug' => 'protected-category',
        ]);

        BlogArticle::query()->create([
            'blog_category_id' => $category->id,
            'slug' => 'linked-article',
            'title' => 'Linked Article',
            'content' => '<p>Content</p>',
            'author_name' => 'Writer',
            'reading_time_minutes' => 1,
            'status' => BlogArticleStatus::Draft,
        ]);

        $this->actingAs($admin, 'admin')->deleteJson('/api/v1/admin/blog/categories/'.$category->id)
            ->assertStatus(422);

        $this->assertDatabaseHas('blog_categories', ['id' => $category->id]);
    }

    #[Test]
    public function admin_blog_mutations_record_audit_logs(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $categoryId = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/categories', [
            'name' => 'Audited Category',
            'slug' => 'audited-category',
        ])->json('data.category.id');

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'blog_category.create',
            'resource_type' => BlogCategory::class,
            'resource_id' => $categoryId,
            'actor_id' => $admin->id,
        ]);

        $tagId = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/tags', [
            'name' => 'Audited Tag',
            'slug' => 'audited-tag',
        ])->json('data.tag.id');

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'blog_tag.create',
            'resource_type' => BlogTag::class,
            'resource_id' => $tagId,
        ]);
    }

    #[Test]
    public function non_admin_cannot_access_blog_admin_routes(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->actingAs($vendor)->getJson('/api/v1/admin/blog/articles')->assertUnauthorized();
        $this->actingAs($vendor)->postJson('/api/v1/admin/blog/articles', [
            'title' => 'Blocked',
            'content' => '<p>Blocked</p>',
            'author_name' => 'Blocked',
        ])->assertUnauthorized();
    }
}
