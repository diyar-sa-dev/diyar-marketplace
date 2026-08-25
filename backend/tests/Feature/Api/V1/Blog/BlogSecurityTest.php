<?php

namespace Tests\Feature\Api\V1\Blog;

use App\Enums\BlogArticleStatus;
use App\Enums\RoleName;
use App\Models\BlogArticle;
use App\Models\BlogCategory;
use Database\Seeders\BlogContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class BlogSecurityTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(BlogContentSeeder::class);
    }

    #[Test]
    public function strips_xss_from_article_content_on_admin_create(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $response = $this->actingAs($admin, 'admin')->postJson('/api/v1/admin/blog/articles', [
            'title' => 'XSS Article',
            'content' => '<p>Safe</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><a href="data:text/html,alert(1)">bad</a>',
            'author_name' => 'Security Writer',
        ])->assertCreated();

        $content = (string) $response->json('data.article.content');
        $this->assertStringNotContainsString('<script>', $content);
        $this->assertStringNotContainsString('<iframe', $content);
        $this->assertStringNotContainsString('data:text/html', $content);
    }

    #[Test]
    public function draft_articles_are_not_public(): void
    {
        $this->getJson('/api/v1/blog/articles/draft-preview-article')
            ->assertNotFound();

        $response = $this->getJson('/api/v1/blog/articles')->assertOk();

        foreach ($response->json('data.items') as $item) {
            $this->assertNotSame('draft-preview-article', $item['slug']);
            $this->assertArrayNotHasKey('status', $item);
        }
    }

    #[Test]
    public function customer_is_denied_admin_blog_routes(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($customer)->getJson('/api/v1/admin/blog/articles')->assertUnauthorized();
        $this->actingAs($customer)->postJson('/api/v1/admin/blog/articles', [
            'title' => 'Blocked',
            'content' => '<p>Blocked</p>',
            'author_name' => 'Blocked',
        ])->assertUnauthorized();
        $this->actingAs($customer, 'admin')->getJson('/api/v1/admin/blog/articles')->assertForbidden();
    }

    #[Test]
    public function caps_invalid_per_page_on_public_listing(): void
    {
        $category = BlogCategory::query()->firstOrFail();

        for ($i = 0; $i < 5; $i++) {
            BlogArticle::query()->create([
                'blog_category_id' => $category->id,
                'slug' => 'security-pagination-'.$i,
                'title' => 'Security Pagination '.$i,
                'content' => '<p>Content</p>',
                'author_name' => 'Security',
                'reading_time_minutes' => 1,
                'status' => BlogArticleStatus::Published,
                'published_at' => now()->subDays($i + 1),
            ]);
        }

        $this->getJson('/api/v1/blog/articles?per_page=100')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 48);

        $this->getJson('/api/v1/blog/articles?per_page=abc')
            ->assertStatus(422);
    }

    #[Test]
    public function rejects_overlong_search_query(): void
    {
        $this->getJson('/api/v1/blog/articles?q='.str_repeat('a', 150))
            ->assertStatus(422);
    }
}
