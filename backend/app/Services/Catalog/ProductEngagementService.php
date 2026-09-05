<?php

namespace App\Services\Catalog;

use App\Events\Domain\ReviewCreated;
use App\Models\Product;
use App\Models\ProductLike;
use App\Models\ProductReview;
use App\Models\User;
use App\Models\WishlistItem;
use App\Services\Review\ProductReviewEligibilityService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class ProductEngagementService
{
    public function __construct(
        private readonly ProductReviewEligibilityService $reviewEligibility,
    ) {}

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
        try {
            return DB::transaction(function () use ($user, $product) {
                $existing = WishlistItem::query()
                    ->where('user_id', $user->id)
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $existing->delete();

                    return ['saved' => false];
                }

                WishlistItem::query()->create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
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

    public function paginateReviews(Product $product, int $page = 1, int $perPage = 5): LengthAwarePaginator
    {
        return ProductReview::query()
            ->with(['user:id,name,avatar_path', 'product.vendorAccount:id,business_name'])
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
            ->with(['user:id,name,avatar_path', 'product.vendorAccount:id,business_name'])
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();
    }

    public function canUserReview(User $user, Product $product): bool
    {
        if ($this->findUserReview($user, $product) !== null) {
            return false;
        }

        return $this->reviewEligibility->canCreateReview($user, $product);
    }

    public function createReview(User $user, Product $product, int $rating, ?string $comment): ProductReview
    {
        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.catalog.review_rating_invalid'));
        }

        $this->reviewEligibility->assertCommentProvided($comment);
        $this->reviewEligibility->assertCanCreateReview($user, $product);

        $normalizedComment = $this->reviewEligibility->normalizeComment($comment);

        try {
            $review = ProductReview::query()->create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'rating' => $rating,
                'comment' => $normalizedComment,
            ])->load('user:id,name,avatar_path');

            DB::afterCommit(fn () => event(new ReviewCreated($review)));

            return $review;
        } catch (QueryException $exception) {
            if ($this->reviewEligibility->isUniqueConstraintViolation($exception)) {
                throw $this->reviewEligibility->duplicateReviewException();
            }

            throw $exception;
        }
    }

    public function updateReview(User $user, Product $product, int $rating, ?string $comment): ProductReview
    {
        $review = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('user_id', $user->id)
            ->first();

        if ($review === null) {
            throw new InvalidArgumentException(__('diyar.catalog.review_not_found'));
        }

        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.catalog.review_rating_invalid'));
        }

        $this->reviewEligibility->assertCommentProvided($comment);
        $this->reviewEligibility->assertReviewOwnership($user, $review);

        $review->update([
            'rating' => $rating,
            'comment' => $this->reviewEligibility->normalizeComment($comment),
        ]);

        return $review->fresh(['user:id,name,avatar_path']);
    }

    public function deleteReview(User $user, Product $product): void
    {
        $review = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('user_id', $user->id)
            ->first();

        if ($review === null) {
            throw new InvalidArgumentException(__('diyar.catalog.review_not_found'));
        }

        $this->reviewEligibility->assertReviewOwnership($user, $review);
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

        if ($product->offsetExists('reviews_count')) {
            return (int) $product->reviews_count;
        }

        return (int) ProductReview::query()->where('product_id', $product->id)->count();
    }

    public function ratingAverage(Product $product): ?float
    {
        if (! $this->engagementTablesExist()) {
            return null;
        }

        if ($product->offsetExists('reviews_avg_rating')) {
            $avg = $product->reviews_avg_rating;

            return $avg === null ? null : round((float) $avg, 1);
        }

        if ($product->offsetExists('reviews_count') && (int) $product->reviews_count === 0) {
            return null;
        }

        $avg = ProductReview::query()->where('product_id', $product->id)->avg('rating');

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

    public function countForUser(User $user): int
    {
        if (! $this->engagementTablesExist()) {
            return 0;
        }

        return WishlistItem::query()
            ->where('user_id', $user->id)
            ->whereHas('product', fn (Builder $query) => $query->publiclyVisible())
            ->count();
    }

    private function engagementTablesExist(): bool
    {
        return Schema::hasTable('product_likes')
            && Schema::hasTable('product_reviews')
            && Schema::hasTable('wishlist_items');
    }
}
