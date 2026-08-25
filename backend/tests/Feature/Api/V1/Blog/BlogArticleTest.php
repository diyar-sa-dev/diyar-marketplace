<?php

namespace Tests\Feature\Api\V1\Blog;

use App\Enums\BlogArticleStatus;
use App\Models\BlogArticle;
use App\Models\BlogCategory;
use Database\Seeders\BlogContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BlogArticleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(BlogContentSeeder::class);
    }

    #[Test]
    public function lists_only_published_articles(): void
    {
        $response = $this->getJson('/api/v1/blog/articles')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items' => [
                        ['id', 'slug', 'title', 'published_at'],
                    ],
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                ],
            ]);

        $this->assertSame(5, $response->json('data.pagination.total'));

        foreach ($response->json('data.items') as $item) {
            $this->assertNotSame('draft-preview-article', $item['slug']);
        }
    }

    #[Test]
    public function shows_published_article_by_slug_with_related(): void
    {
        $this->getJson('/api/v1/blog/articles/interior-design-trends-2024')
            ->assertOk()
            ->assertJsonPath('data.article.slug', 'interior-design-trends-2024')
            ->assertJsonPath('data.article.title', 'أحدث اتجاهات التصميم الداخلي لعام 2024: العودة إلى الطبيعة')
            ->assertJsonCount(1, 'data.related');
    }

    #[Test]
    public function hides_draft_articles_from_public_detail(): void
    {
        $this->getJson('/api/v1/blog/articles/draft-preview-article')
            ->assertNotFound();
    }

    #[Test]
    public function lists_blog_categories_with_published_counts(): void
    {
        $this->getJson('/api/v1/blog/categories')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'categories' => [
                        ['id', 'slug', 'name', 'published_articles_count'],
                    ],
                ],
            ]);
    }

    #[Test]
    public function lists_published_articles_by_tag_slug(): void
    {
        $this->getJson('/api/v1/blog/tags/interior-design')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.slug', 'interior-design-trends-2024');
    }

    #[Test]
    public function filters_articles_by_category_slug(): void
    {
        $category = BlogCategory::query()->where('slug', 'decor-tips')->firstOrFail();

        BlogArticle::query()->create([
            'blog_category_id' => $category->id,
            'slug' => 'extra-decor-tip',
            'title' => 'Extra Decor Tip',
            'content' => '<p>Published tip.</p>',
            'author_name' => 'فريق ديار',
            'reading_time_minutes' => 2,
            'status' => BlogArticleStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $this->getJson('/api/v1/blog/articles?category=decor-tips')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 3);
    }

    #[Test]
    public function respects_pagination_limits(): void
    {
        $category = BlogCategory::query()->firstOrFail();

        for ($i = 0; $i < 15; $i++) {
            BlogArticle::query()->create([
                'blog_category_id' => $category->id,
                'slug' => 'pagination-article-'.$i,
                'title' => 'Pagination Article '.$i,
                'content' => '<p>Content</p>',
                'author_name' => 'فريق ديار',
                'reading_time_minutes' => 1,
                'status' => BlogArticleStatus::Published,
                'published_at' => now()->subDays($i + 1),
            ]);
        }

        $this->getJson('/api/v1/blog/articles?per_page=48')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 48);

        $this->getJson('/api/v1/blog/articles?per_page=100')
            ->assertOk()
            ->assertJsonPath('data.pagination.per_page', 48);
    }

    #[Test]
    public function returns_not_found_for_unknown_tag(): void
    {
        $this->getJson('/api/v1/blog/tags/unknown-tag')
            ->assertNotFound();
    }
}
