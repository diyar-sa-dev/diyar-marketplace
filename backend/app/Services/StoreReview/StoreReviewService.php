<?php

namespace App\Services\StoreReview;

use App\Models\Order;
use App\Models\StoreReview;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Services\Catalog\VendorService;
use App\Services\Review\OrderFulfillmentReviewEligibility;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class StoreReviewService
{
    public function __construct(
        private readonly VendorService $vendors,
        private readonly OrderFulfillmentReviewEligibility $eligibility,
        private readonly VendorOwnership $vendorOwnership,
    ) {}

    public function findActiveVendorBySlug(string $slug): VendorAccount
    {
        return $this->vendors->findActiveBySlug($slug);
    }

    public function paginateReviews(VendorAccount $vendor, int $page = 1, int $perPage = 5): LengthAwarePaginator
    {
        return StoreReview::query()
            ->with(['user:id,name,avatar_path', 'vendorAccount:id,business_name'])
            ->where('vendor_account_id', $vendor->id)
            ->latest()
            ->paginate(perPage: min($perPage, 20), page: max($page, 1));
    }

    /**
     * @return array{
     *   average_rating: ?float,
     *   review_count: int,
     *   distribution: list<array{stars: int, count: int, percentage: int}>
     * }
     */
    public function ratingSummary(VendorAccount $vendor): array
    {
        $countsByRating = StoreReview::query()
            ->where('vendor_account_id', $vendor->id)
            ->selectRaw('rating, COUNT(*) as aggregate_count')
            ->groupBy('rating')
            ->pluck('aggregate_count', 'rating');

        $reviewCount = (int) $countsByRating->sum();
        $averageRating = null;

        if ($reviewCount > 0) {
            $weightedSum = 0;
            foreach ($countsByRating as $rating => $count) {
                $weightedSum += (int) $rating * (int) $count;
            }
            $averageRating = round($weightedSum / $reviewCount, 1);
        }

        $distribution = [];
        for ($stars = 5; $stars >= 1; $stars--) {
            $count = (int) ($countsByRating[$stars] ?? 0);
            $percentage = $reviewCount > 0 ? (int) round(($count / $reviewCount) * 100) : 0;
            $distribution[] = [
                'stars' => $stars,
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return [
            'average_rating' => $averageRating,
            'review_count' => $reviewCount,
            'distribution' => $distribution,
        ];
    }

    public function reviewsCount(VendorAccount $vendor): int
    {
        return StoreReview::query()->where('vendor_account_id', $vendor->id)->count();
    }

    public function ratingAverage(VendorAccount $vendor): ?float
    {
        $avg = StoreReview::query()->where('vendor_account_id', $vendor->id)->avg('rating');

        if ($avg === null) {
            return null;
        }

        return round((float) $avg, 1);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function eligibilityForOrder(User $user, Order $order): array
    {
        if ($order->user_id !== $user->id) {
            throw new InvalidArgumentException(__('diyar.store_review.order_not_owned'));
        }

        $order->loadMissing(['vendorOrders.vendorAccount', 'payment']);

        $existingReviews = StoreReview::query()
            ->where('user_id', $user->id)
            ->where('order_id', $order->id)
            ->get()
            ->keyBy('vendor_account_id');

        return $order->vendorOrders
            ->map(function (VendorOrder $vendorOrder) use ($user, $order, $existingReviews) {
                $vendorAccount = $vendorOrder->vendorAccount;
                $existing = $existingReviews->get($vendorOrder->vendor_account_id);

                if ($existing !== null) {
                    return [
                        'vendor_account_id' => $vendorOrder->vendor_account_id,
                        'vendor_order_id' => $vendorOrder->id,
                        'vendor_name' => $vendorAccount?->business_name,
                        'vendor_slug' => $vendorAccount?->slug,
                        'status' => 'already_reviewed',
                        'review' => $this->formatReviewPayload($existing->loadMissing('user:id,name,avatar_path')),
                    ];
                }

                if ($this->vendorOwnership->userOwnsVendorAccount($user, $vendorOrder->vendor_account_id)) {
                    return [
                        'vendor_account_id' => $vendorOrder->vendor_account_id,
                        'vendor_order_id' => $vendorOrder->id,
                        'vendor_name' => $vendorAccount?->business_name,
                        'vendor_slug' => $vendorAccount?->slug,
                        'status' => 'not_eligible',
                        'review' => null,
                    ];
                }

                if ($this->eligibility->isVendorOrderEligible($vendorOrder, $order)) {
                    return [
                        'vendor_account_id' => $vendorOrder->vendor_account_id,
                        'vendor_order_id' => $vendorOrder->id,
                        'vendor_name' => $vendorAccount?->business_name,
                        'vendor_slug' => $vendorAccount?->slug,
                        'status' => 'eligible',
                        'review' => null,
                    ];
                }

                return [
                    'vendor_account_id' => $vendorOrder->vendor_account_id,
                    'vendor_order_id' => $vendorOrder->id,
                    'vendor_name' => $vendorAccount?->business_name,
                    'vendor_slug' => $vendorAccount?->slug,
                    'status' => 'not_eligible',
                    'review' => null,
                ];
            })
            ->values()
            ->all();
    }

    public function createReview(
        User $user,
        VendorAccount $vendor,
        string $orderId,
        int $rating,
        ?string $comment,
    ): StoreReview {
        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.store_review.rating_invalid'));
        }

        $order = Order::query()
            ->with(['vendorOrders.vendorAccount', 'payment'])
            ->where('id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if ($order === null) {
            throw new InvalidArgumentException(__('diyar.store_review.order_not_owned'));
        }

        $vendorOrder = $order->vendorOrders
            ->first(fn (VendorOrder $candidate) => $candidate->vendor_account_id === $vendor->id);

        if ($vendorOrder === null) {
            throw new InvalidArgumentException(__('diyar.store_review.store_not_in_order'));
        }

        if (! $this->eligibility->isVendorOrderEligible($vendorOrder, $order)) {
            throw new InvalidArgumentException(__('diyar.store_review.not_eligible'));
        }

        $this->assertNotSelfReview($user, $vendor);

        $normalizedComment = $this->normalizeComment($comment);

        try {
            return DB::transaction(function () use ($user, $vendor, $order, $vendorOrder, $rating, $normalizedComment) {
                $existing = StoreReview::query()
                    ->where('user_id', $user->id)
                    ->where('vendor_account_id', $vendor->id)
                    ->where('order_id', $order->id)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    throw new ConflictHttpException(__('diyar.store_review.already_reviewed'));
                }

                return StoreReview::query()->create([
                    'user_id' => $user->id,
                    'vendor_account_id' => $vendor->id,
                    'order_id' => $order->id,
                    'vendor_order_id' => $vendorOrder->id,
                    'rating' => $rating,
                    'comment' => $normalizedComment,
                ])->load(['user:id,name,avatar_path', 'vendorAccount:id,business_name']);
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                throw new ConflictHttpException(__('diyar.store_review.already_reviewed'));
            }

            throw $exception;
        }
    }

    public function findOwnedReview(User $user, string $reviewId): StoreReview
    {
        $review = StoreReview::query()->whereKey($reviewId)->first();

        if ($review === null) {
            throw new NotFoundHttpException(__('diyar.store_review.not_found'));
        }

        if ($review->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.catalog.cannot_edit_other_review'));
        }

        return $review;
    }

    public function updateReview(User $user, StoreReview $review, int $rating, ?string $comment): StoreReview
    {
        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.store_review.rating_invalid'));
        }

        $this->findOwnedReview($user, $review->id);

        if ($comment !== null && trim(strip_tags($comment)) === '') {
            throw new InvalidArgumentException(__('diyar.store_review.comment_empty'));
        }

        $review->update([
            'rating' => $rating,
            'comment' => $this->normalizeComment($comment),
        ]);

        return $review->fresh(['user:id,name,avatar_path', 'vendorAccount', 'order:id,order_number']);
    }

    public function deleteReview(User $user, StoreReview $review): void
    {
        $this->findOwnedReview($user, $review->id);
        $review->delete();
    }

    private function assertNotSelfReview(User $user, VendorAccount $vendor): void
    {
        if ($this->vendorOwnership->userOwnsVendor($user, $vendor)) {
            throw new AccessDeniedHttpException(__('diyar.store_review.cannot_review_own_store'));
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReviewPayload(StoreReview $review): array
    {
        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at?->toIso8601String(),
        ];
    }

    private function normalizeComment(?string $comment): ?string
    {
        if ($comment === null) {
            return null;
        }

        $trimmed = trim(strip_tags($comment));

        return $trimmed === '' ? null : $trimmed;
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
