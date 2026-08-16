<?php

namespace App\Services\Catalog;

use App\Models\Product;
use App\Models\ProductLike;
use App\Models\ProductReview;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class ProductEngagementService
{
    public function findPublicProduct(string $id): Product
    {
        return app(ProductService::class)->findPublic($id);
    }

    /**
     * @return array{liked: bool, likes_count: int}
     */
    public function toggleLike(User $user, Product $product): array
    {
        return DB::transaction(function () use ($user, $product) {
            $existing = ProductLike::query()
                ->where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $liked = false;
            } else {
                ProductLike::query()->create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                ]);
                $liked = true;
            }

            return [
                'liked' => $liked,
                'likes_count' => ProductLike::query()->where('product_id', $product->id)->count(),
            ];
        });
    }

    /**
     * @return array{saved: bool}
     */
    public function toggleWishlist(User $user, Product $product): array
    {
        return DB::transaction(function () use ($user, $product) {
            $existing = WishlistItem::query()
                ->where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $saved = false;
            } else {
                WishlistItem::query()->create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                ]);
                $saved = true;
            }

            return ['saved' => $saved];
        });
    }

    public function paginateReviews(Product $product, int $page = 1, int $perPage = 5): LengthAwarePaginator
    {
        return ProductReview::query()
            ->with('user:id,name,avatar_path')
            ->where('product_id', $product->id)
            ->latest()
            ->paginate(perPage: min($perPage, 20), page: max($page, 1));
    }

    public function findUserReview(User $user, Product $product): ?ProductReview
    {
        if (! $this->engagementTablesExist()) {
            return null;
        }

        return ProductReview::query()
            ->with('user:id,name,avatar_path')
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();
    }

    public function createReview(User $user, Product $product, int $rating, ?string $comment): ProductReview
    {
        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.catalog.review_rating_invalid'));
        }

        return ProductReview::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'product_id' => $product->id,
            ],
            [
                'rating' => $rating,
                'comment' => $comment,
            ],
        )->load('user:id,name,avatar_path');
    }

    public function updateReview(User $user, Product $product, int $rating, ?string $comment): ProductReview
    {
        $review = $this->findUserReview($user, $product);

        if ($review === null) {
            throw new InvalidArgumentException(__('diyar.catalog.review_not_found'));
        }

        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.catalog.review_rating_invalid'));
        }

        $review->update([
            'rating' => $rating,
            'comment' => $comment,
        ]);

        return $review->fresh(['user:id,name,avatar_path']);
    }

    public function deleteReview(User $user, Product $product): void
    {
        $review = $this->findUserReview($user, $product);

        if ($review === null) {
            throw new InvalidArgumentException(__('diyar.catalog.review_not_found'));
        }

        $review->delete();
    }

    public function userLiked(?User $user, Product $product): bool
    {
        if ($user === null || ! $this->engagementTablesExist()) {
            return false;
        }

        return ProductLike::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();
    }

    public function userSaved(?User $user, Product $product): bool
    {
        if ($user === null || ! $this->engagementTablesExist()) {
            return false;
        }

        return WishlistItem::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->exists();
    }

    public function likesCount(Product $product): int
    {
        if (! $this->engagementTablesExist()) {
            return 0;
        }

        return (int) ($product->likes_count ?? ProductLike::query()->where('product_id', $product->id)->count());
    }

    public function reviewsCount(Product $product): int
    {
        if (! $this->engagementTablesExist()) {
            return 0;
        }

        return (int) ($product->reviews_count ?? ProductReview::query()->where('product_id', $product->id)->count());
    }

    public function ratingAverage(Product $product): ?float
    {
        if (! $this->engagementTablesExist()) {
            return null;
        }

        $avg = $product->reviews_avg_rating ?? ProductReview::query()->where('product_id', $product->id)->avg('rating');

        if ($avg === null) {
            return null;
        }

        return round((float) $avg, 1);
    }

    public function paginateWishlist(User $user, int $page = 1, int $perPage = 12): LengthAwarePaginator
    {
        if (! $this->engagementTablesExist()) {
            return WishlistItem::query()->whereRaw('1 = 0')->paginate($perPage, ['*'], 'page', $page);
        }

        return WishlistItem::query()
            ->where('user_id', $user->id)
            ->whereHas('product', fn (Builder $query) => $query->publiclyVisible())
            ->with([
                'product.vendorAccount',
                'product.category',
                'product.images.mediaFile',
                'product.inventory',
            ])
            ->latest()
            ->paginate(perPage: min($perPage, 48), page: max($page, 1));
    }

    public function clearWishlist(User $user): int
    {
        if (! $this->engagementTablesExist()) {
            return 0;
        }

        return WishlistItem::query()->where('user_id', $user->id)->delete();
    }

    private function engagementTablesExist(): bool
    {
        return Schema::hasTable('product_likes')
            && Schema::hasTable('product_reviews')
            && Schema::hasTable('wishlist_items');
    }
}
