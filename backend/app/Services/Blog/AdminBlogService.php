<?php

namespace App\Services\Blog;

use App\Enums\BlogArticleStatus;
use App\Models\BlogArticle;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Models\User;
use App\Services\Admin\AdminAuditService;
use App\Support\Cache\BlogProjectCache;
use Illuminate\Support\Facades\DB;

final class AdminBlogService
{
    public function __construct(
        private readonly BlogService $blog,
        private readonly AdminAuditService $audit,
        private readonly BlogProjectCache $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createArticle(array $attributes, User $actor): BlogArticle
    {
        return DB::transaction(function () use ($attributes, $actor): BlogArticle {
            $content = $this->blog->sanitizeContent($attributes['content'] ?? '');
            $slug = $this->blog->generateSlug(
                $attributes['title'],
                $attributes['slug'] ?? null,
            );

            $article = BlogArticle::query()->create([
                'blog_category_id' => $attributes['blog_category_id'] ?? null,
                'slug' => $slug,
                'title' => $attributes['title'],
                'excerpt' => $attributes['excerpt'] ?? null,
                'content' => $content,
                'hero_image' => $attributes['hero_image'] ?? null,
                'author_name' => $attributes['author_name'],
                'author_avatar' => $attributes['author_avatar'] ?? null,
                'author_role' => $attributes['author_role'] ?? null,
                'reading_time_minutes' => $this->blog->calculateReadingTimeMinutes($content),
                'published_at' => $attributes['published_at'] ?? null,
                'status' => $attributes['status'] ?? BlogArticleStatus::Draft->value,
                'seo_title' => $attributes['seo_title'] ?? null,
                'seo_description' => $attributes['seo_description'] ?? null,
            ]);

            $this->syncTags($article, $attributes['tag_ids'] ?? []);

            $article->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: 'blog_article.create',
                resource: $article,
                after: $this->articleSnapshot($article),
            );

            $this->cache->forgetBlog();

            return $article;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateArticle(BlogArticle $article, array $attributes, User $actor): BlogArticle
    {
        return DB::transaction(function () use ($article, $attributes, $actor): BlogArticle {
            $before = $this->articleSnapshot($article);

            if (array_key_exists('content', $attributes)) {
                $attributes['content'] = $this->blog->sanitizeContent($attributes['content']);
                $attributes['reading_time_minutes'] = $this->blog->calculateReadingTimeMinutes($attributes['content']);
            }

            if (array_key_exists('title', $attributes) || array_key_exists('slug', $attributes)) {
                $attributes['slug'] = $this->blog->generateSlug(
                    $attributes['title'] ?? $article->title,
                    $attributes['slug'] ?? null,
                    $article->id,
                );
            }

            $article->fill([
                'blog_category_id' => $attributes['blog_category_id'] ?? $article->blog_category_id,
                'slug' => $attributes['slug'] ?? $article->slug,
                'title' => $attributes['title'] ?? $article->title,
                'excerpt' => $attributes['excerpt'] ?? $article->excerpt,
                'content' => $attributes['content'] ?? $article->content,
                'hero_image' => $attributes['hero_image'] ?? $article->hero_image,
                'author_name' => $attributes['author_name'] ?? $article->author_name,
                'author_avatar' => $attributes['author_avatar'] ?? $article->author_avatar,
                'author_role' => $attributes['author_role'] ?? $article->author_role,
                'reading_time_minutes' => $attributes['reading_time_minutes'] ?? $article->reading_time_minutes,
                'published_at' => $attributes['published_at'] ?? $article->published_at,
                'status' => $attributes['status'] ?? $article->status,
                'seo_title' => $attributes['seo_title'] ?? $article->seo_title,
                'seo_description' => $attributes['seo_description'] ?? $article->seo_description,
            ])->save();

            if (array_key_exists('tag_ids', $attributes)) {
                $this->syncTags($article, $attributes['tag_ids']);
            }

            $article->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: 'blog_article.update',
                resource: $article,
                before: $before,
                after: $this->articleSnapshot($article),
            );

            $this->cache->forgetBlog();

            return $article;
        });
    }

    public function deleteArticle(BlogArticle $article, User $actor): void
    {
        DB::transaction(function () use ($article, $actor): void {
            $before = $this->articleSnapshot($article);
            $article->delete();

            $this->audit->record(
                actor: $actor,
                action: 'blog_article.delete',
                resource: $article,
                before: $before,
            );

            $this->cache->forgetBlog();
        });
    }

    public function publishArticle(BlogArticle $article, User $actor): BlogArticle
    {
        return $this->transitionArticle($article, $actor, BlogArticleStatus::Published, 'blog_article.publish', [
            'published_at' => $article->published_at ?? now(),
        ]);
    }

    public function unpublishArticle(BlogArticle $article, User $actor): BlogArticle
    {
        return $this->transitionArticle($article, $actor, BlogArticleStatus::Draft, 'blog_article.unpublish');
    }

    public function archiveArticle(BlogArticle $article, User $actor): BlogArticle
    {
        return $this->transitionArticle($article, $actor, BlogArticleStatus::Archived, 'blog_article.archive');
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createCategory(array $attributes, User $actor): BlogCategory
    {
        return DB::transaction(function () use ($attributes, $actor): BlogCategory {
            $category = BlogCategory::query()->create([
                'name' => $attributes['name'],
                'slug' => $this->blog->generateCategorySlug($attributes['name'], $attributes['slug'] ?? null),
                'description' => $attributes['description'] ?? null,
            ]);

            $this->audit->record(
                actor: $actor,
                action: 'blog_category.create',
                resource: $category,
                after: $this->categorySnapshot($category),
            );

            $this->cache->forgetBlog();

            return $category;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateCategory(BlogCategory $category, array $attributes, User $actor): BlogCategory
    {
        return DB::transaction(function () use ($category, $attributes, $actor): BlogCategory {
            $before = $this->categorySnapshot($category);

            if (array_key_exists('name', $attributes) || array_key_exists('slug', $attributes)) {
                $attributes['slug'] = $this->blog->generateCategorySlug(
                    $attributes['name'] ?? $category->name,
                    $attributes['slug'] ?? null,
                );
            }

            $category->fill([
                'name' => $attributes['name'] ?? $category->name,
                'slug' => $attributes['slug'] ?? $category->slug,
                'description' => $attributes['description'] ?? $category->description,
            ])->save();

            $this->audit->record(
                actor: $actor,
                action: 'blog_category.update',
                resource: $category,
                before: $before,
                after: $this->categorySnapshot($category),
            );

            $this->cache->forgetBlog();

            return $category;
        });
    }

    public function deleteCategory(BlogCategory $category, User $actor): void
    {
        DB::transaction(function () use ($category, $actor): void {
            if ($category->articles()->exists()) {
                abort(422, __('diyar.blog.category_has_articles'));
            }

            $before = $this->categorySnapshot($category);
            $category->delete();

            $this->audit->record(
                actor: $actor,
                action: 'blog_category.delete',
                resource: $category,
                before: $before,
            );

            $this->cache->forgetBlog();
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createTag(array $attributes, User $actor): BlogTag
    {
        return DB::transaction(function () use ($attributes, $actor): BlogTag {
            $tag = BlogTag::query()->create([
                'name' => $attributes['name'],
                'slug' => $this->blog->generateTagSlug($attributes['name'], $attributes['slug'] ?? null),
            ]);

            $this->audit->record(
                actor: $actor,
                action: 'blog_tag.create',
                resource: $tag,
                after: $this->tagSnapshot($tag),
            );

            $this->cache->forgetBlog();

            return $tag;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateTag(BlogTag $tag, array $attributes, User $actor): BlogTag
    {
        return DB::transaction(function () use ($tag, $attributes, $actor): BlogTag {
            $before = $this->tagSnapshot($tag);

            if (array_key_exists('name', $attributes) || array_key_exists('slug', $attributes)) {
                $attributes['slug'] = $this->blog->generateTagSlug(
                    $attributes['name'] ?? $tag->name,
                    $attributes['slug'] ?? null,
                );
            }

            $tag->fill([
                'name' => $attributes['name'] ?? $tag->name,
                'slug' => $attributes['slug'] ?? $tag->slug,
            ])->save();

            $this->audit->record(
                actor: $actor,
                action: 'blog_tag.update',
                resource: $tag,
                before: $before,
                after: $this->tagSnapshot($tag),
            );

            $this->cache->forgetBlog();

            return $tag;
        });
    }

    public function deleteTag(BlogTag $tag, User $actor): void
    {
        DB::transaction(function () use ($tag, $actor): void {
            $before = $this->tagSnapshot($tag);
            $tag->articles()->detach();
            $tag->delete();

            $this->audit->record(
                actor: $actor,
                action: 'blog_tag.delete',
                resource: $tag,
                before: $before,
            );

            $this->cache->forgetBlog();
        });
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function transitionArticle(
        BlogArticle $article,
        User $actor,
        BlogArticleStatus $status,
        string $action,
        array $extra = [],
    ): BlogArticle {
        return DB::transaction(function () use ($article, $actor, $status, $action, $extra): BlogArticle {
            $before = $this->articleSnapshot($article);

            $article->fill(array_merge(['status' => $status], $extra))->save();
            $article->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $article,
                before: $before,
                after: $this->articleSnapshot($article),
            );

            $this->cache->forgetBlog();

            return $article;
        });
    }

    /**
     * @param  list<string>  $tagIds
     */
    private function syncTags(BlogArticle $article, array $tagIds): void
    {
        $article->tags()->sync($tagIds);
    }

    /** @return array<string, mixed> */
    private function articleSnapshot(BlogArticle $article): array
    {
        return [
            'slug' => $article->slug,
            'title' => $article->title,
            'status' => $article->status->value,
            'blog_category_id' => $article->blog_category_id,
            'published_at' => $article->published_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function categorySnapshot(BlogCategory $category): array
    {
        return [
            'slug' => $category->slug,
            'name' => $category->name,
        ];
    }

    /** @return array<string, mixed> */
    private function tagSnapshot(BlogTag $tag): array
    {
        return [
            'slug' => $tag->slug,
            'name' => $tag->name,
        ];
    }
}
