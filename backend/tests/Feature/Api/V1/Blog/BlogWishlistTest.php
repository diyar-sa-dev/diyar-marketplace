<?php

namespace Tests\Feature\Api\V1\Blog;

use App\Models\BlogArticle;
use App\Models\User;
use Database\Seeders\BlogContentSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BlogWishlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        $this->seed(BlogContentSeeder::class);
    }

    #[Test]
    public function user_can_save_and_unsave_blog_article(): void
    {
        $user = User::factory()->create();
        $article = BlogArticle::query()->published()->firstOrFail();

        $this->actingAs($user)
            ->postJson('/api/v1/blog/articles/'.$article->slug.'/wishlist')
            ->assertOk()
            ->assertJsonPath('data.saved', true);

        $this->actingAs($user)
            ->postJson('/api/v1/blog/articles/'.$article->slug.'/wishlist')
            ->assertOk()
            ->assertJsonPath('data.saved', false);
    }

    #[Test]
    public function blog_article_detail_includes_user_saved_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $article = BlogArticle::query()->published()->firstOrFail();

        $this->actingAs($user)->postJson('/api/v1/blog/articles/'.$article->slug.'/wishlist')->assertOk();

        $this->actingAs($user)
            ->getJson('/api/v1/blog/articles/'.$article->slug)
            ->assertOk()
            ->assertJsonPath('data.article.user_saved', true);
    }

    #[Test]
    public function blog_wishlist_requires_authentication(): void
    {
        $article = BlogArticle::query()->published()->firstOrFail();

        $this->postJson('/api/v1/blog/articles/'.$article->slug.'/wishlist')
            ->assertUnauthorized();
    }

    #[Test]
    public function user_can_list_saved_blog_articles_in_profile_wishlist(): void
    {
        $user = User::factory()->create();
        $article = BlogArticle::query()->published()->firstOrFail();

        $this->actingAs($user)->postJson('/api/v1/blog/articles/'.$article->slug.'/wishlist')->assertOk();

        $this->actingAs($user)
            ->getJson('/api/v1/profile/wishlist?kind=articles')
            ->assertOk()
            ->assertJsonPath('data.kind', 'articles')
            ->assertJsonPath('data.items.0.slug', $article->slug)
            ->assertJsonPath('data.items.0.user_saved', true);
    }
}
