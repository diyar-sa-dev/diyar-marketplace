<?php

namespace App\Services\Blog;

use App\Models\BlogArticle;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Support\Cache\BlogProjectCache;
use App\Support\Cache\CachesQueryResults;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class BlogQueryService
{
    /** @var list<string> */
    private const LISTING_COLUMNS = [
        'id',
        'blog_category_id',
        'slug',
        'title',
        'excerpt',
        'hero_image',
        'author_name',
        'author_avatar',
        'author_role',
        'reading_time_minutes',
        'published_at',
        'status',
    ];

    public function __construct(
        private readonly BlogProjectCache $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublished(array $filters = []): LengthAwarePaginator
    {
        $cacheKey = $this->cache->blogArticlesListKey($filters);

        return CachesQueryResults::rememberPaginator(
            $cacheKey,
            $this->cache->ttl(),
            function () use ($filters) {
                $query = $this->publishedQuery()
                    ->select(self::LISTING_COLUMNS)
                    ->with(['category', 'tags']);

                $this->applyArticleFilters($query, $filters);
                $this->applyArticleSort($query, (string) ($filters['sort'] ?? 'latest'));

                return $query->paginate($this->resolvePerPage($filters));
            },
            BlogArticle::class,
            ['category', 'tags'],
        );
    }

    public function findPublishedBySlug(string $slug): BlogArticle
    {
        $cacheKey = $this->cache->blogArticleDetailKey($slug);

        $article = CachesQueryResults::rememberModel(
            $cacheKey,
            $this->cache->ttl(),
            fn () => $this->publishedQuery()
                ->with(['category', 'tags'])
                ->where('slug', $slug)
                ->first(),
            BlogArticle::class,
            ['category', 'tags'],
        );

        if ($article === null) {
            throw new NotFoundHttpException(__('diyar.blog.article_not_found'));
        }

        return $article;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublishedByTagSlug(string $slug, array $filters = []): LengthAwarePaginator
    {
        $cacheKey = $this->cache->blogTagArticlesKey($slug, $filters);

        return CachesQueryResults::rememberPaginator(
            $cacheKey,
            $this->cache->ttl(),
            function () use ($slug, $filters) {
                $tag = BlogTag::query()->where('slug', $slug)->first();

                if ($tag === null) {
                    throw new NotFoundHttpException(__('diyar.blog.tag_not_found'));
                }

                $query = $this->publishedQuery()
                    ->select(self::LISTING_COLUMNS)
                    ->with(['category', 'tags'])
                    ->whereHas('tags', fn (Builder $q) => $q->where('blog_tags.id', $tag->id));

                $this->applyArticleSort($query, (string) ($filters['sort'] ?? 'latest'));

                return $query->paginate($this->resolvePerPage($filters));
            },
            BlogArticle::class,
            ['category', 'tags'],
        );
    }

    /**
     * @return Collection<int, BlogArticle>
     */
    public function relatedPublished(BlogArticle $article, int $limit = 3): Collection
    {
        $limit = min(max($limit, 1), 6);

        $article->loadMissing('tags');
        $tagIds = $article->tags->pluck('id');

        if ($article->blog_category_id === null && $tagIds->isEmpty()) {
            return new Collection;
        }

        $query = $this->publishedQuery()
            ->select(self::LISTING_COLUMNS)
            ->with(['category', 'tags'])
            ->where('id', '!=', $article->id)
            ->where(function (Builder $q) use ($article, $tagIds): void {
                if ($article->blog_category_id !== null) {
                    $q->where('blog_category_id', $article->blog_category_id);
                }

                if ($tagIds->isNotEmpty()) {
                    if ($article->blog_category_id !== null) {
                        $q->orWhereHas('tags', fn (Builder $tagQuery) => $tagQuery->whereIn('blog_tags.id', $tagIds));
                    } else {
                        $q->whereHas('tags', fn (Builder $tagQuery) => $tagQuery->whereIn('blog_tags.id', $tagIds));
                    }
                }
            })
            ->orderByDesc('published_at')
            ->limit($limit);

        return $query->get();
    }

    /**
     * @return Collection<int, BlogCategory>
     */
    public function listCategories(): Collection
    {
        $cacheKey = $this->cache->blogCategoriesKey();

        return CachesQueryResults::rememberCollection(
            $cacheKey,
            $this->cache->ttl(),
            fn () => BlogCategory::query()
                ->orderBy('name')
                ->withCount(['articles as published_articles_count' => fn (Builder $q) => $q->published()])
                ->get(),
            BlogCategory::class,
        );
    }

    /**
     * @return Builder<BlogArticle>
     */
    private function publishedQuery(): Builder
    {
        return BlogArticle::query()->published();
    }

    /**
     * @param  Builder<BlogArticle>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyArticleFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['category'])) {
            $categorySlug = (string) $filters['category'];
            $query->whereHas('category', fn (Builder $q) => $q->where('slug', $categorySlug));
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term): void {
                $q->where('title', 'like', $term)
                    ->orWhere('excerpt', 'like', $term);
            });
        }
    }

    /**
     * @param  Builder<BlogArticle>  $query
     */
    private function applyArticleSort(Builder $query, string $sort): void
    {
        match ($sort) {
            'oldest' => $query->orderBy('published_at'),
            default => $query->orderByDesc('published_at'),
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function resolvePerPage(array $filters): int
    {
        return min(max((int) ($filters['per_page'] ?? 12), 1), 48);
    }
}
