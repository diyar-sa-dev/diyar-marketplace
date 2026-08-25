<?php

namespace App\Services\Blog;

use App\Enums\BlogArticleStatus;
use App\Models\BlogArticle;
use App\Models\BlogWishlistItem;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class BlogEngagementService
{
    public function __construct(
        private readonly BlogQueryService $blog,
    ) {}

    public function findPublicArticle(string $slug): BlogArticle
    {
        return $this->blog->findPublishedBySlug($slug);
    }

    /**
     * @return array{saved: bool}
     */
    public function toggleWishlist(User $user, BlogArticle $article): array
    {
        try {
            return DB::transaction(function () use ($user, $article) {
                $existing = BlogWishlistItem::query()
                    ->where('user_id', $user->id)
                    ->where('blog_article_id', $article->id)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $existing->delete();

                    return ['saved' => false];
                }

                BlogWishlistItem::query()->create([
                    'user_id' => $user->id,
                    'blog_article_id' => $article->id,
                ]);

                return ['saved' => true];
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                return ['saved' => true];
            }

            throw $exception;
        }
    }

    public function userSaved(?User $user, BlogArticle $article): bool
    {
        if ($user === null || ! $this->tablesExist()) {
            return false;
        }

        if (array_key_exists('user_saved', $article->getAttributes())) {
            return (bool) $article->user_saved;
        }

        return BlogWishlistItem::query()
            ->where('user_id', $user->id)
            ->where('blog_article_id', $article->id)
            ->exists();
    }

    public function paginateWishlist(User $user, int $page = 1, int $perPage = 12): LengthAwarePaginator
    {
        if (! $this->tablesExist()) {
            return BlogWishlistItem::query()->whereRaw('1 = 0')->paginate($perPage, ['*'], 'page', $page);
        }

        return BlogWishlistItem::query()
            ->where('user_id', $user->id)
            ->whereHas('article', fn (Builder $query) => $query
                ->where('status', BlogArticleStatus::Published)
                ->whereNotNull('published_at')
                ->where('published_at', '<=', now()))
            ->with(['article.category', 'article.tags'])
            ->latest()
            ->paginate(perPage: min($perPage, 48), page: max($page, 1));
    }

    public function clearWishlist(User $user): int
    {
        if (! $this->tablesExist()) {
            return 0;
        }

        return BlogWishlistItem::query()->where('user_id', $user->id)->delete();
    }

    public function countForUser(User $user): int
    {
        if (! $this->tablesExist()) {
            return 0;
        }

        return BlogWishlistItem::query()
            ->where('user_id', $user->id)
            ->whereHas('article', fn (Builder $query) => $query
                ->where('status', BlogArticleStatus::Published)
                ->whereNotNull('published_at')
                ->where('published_at', '<=', now()))
            ->count();
    }

    private function tablesExist(): bool
    {
        return Schema::hasTable('blog_wishlist_items');
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
