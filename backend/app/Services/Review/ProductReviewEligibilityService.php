<?php

namespace App\Services\Review;

use App\Enums\PaymentStatus;
use App\Enums\VendorOrderStatus;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ProductReviewEligibilityService
{
    public function __construct(
        private readonly VendorOwnership $vendorOwnership,
    ) {}

    public function assertCanCreateReview(User $user, Product $product): void
    {
        if (! $this->canCreateReview($user, $product)) {
            if ($this->vendorOwnership->userOwnsProduct($user, $product)) {
                throw new AccessDeniedHttpException(__('diyar.catalog.cannot_review_own_product'));
            }

            throw new AccessDeniedHttpException(__('diyar.catalog.review_not_eligible'));
        }
    }

    public function canCreateReview(User $user, Product $product): bool
    {
        if ($this->vendorOwnership->userOwnsProduct($user, $product)) {
            return false;
        }

        return $this->hasVerifiedPurchase($user, $product);
    }

    public function assertReviewOwnership(User $user, ProductReview $review): void
    {
        if ($review->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.catalog.cannot_edit_other_review'));
        }
    }

    public function hasVerifiedPurchase(User $user, Product $product): bool
    {
        return OrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('vendorOrder', fn (Builder $query) => $this->eligibleVendorOrderQuery($query, $user))
            ->exists();
    }

    public function eligibleVendorOrderQuery(Builder $query, User $user): Builder
    {
        return $query
            ->where('status', VendorOrderStatus::Delivered)
            ->whereHas('order', function (Builder $orderQuery) use ($user) {
                $orderQuery
                    ->where('user_id', $user->id)
                    ->whereHas('payment', fn (Builder $paymentQuery) => $paymentQuery->whereIn('status', [
                        PaymentStatus::Paid,
                        PaymentStatus::PartiallyRefunded,
                    ]));
            });
    }

    public function normalizeComment(?string $comment): ?string
    {
        if ($comment === null) {
            return null;
        }

        $trimmed = trim(strip_tags($comment));

        return $trimmed === '' ? null : $trimmed;
    }

    public function assertCommentProvided(?string $comment): void
    {
        if ($comment === null) {
            return;
        }

        if (trim(strip_tags($comment)) === '') {
            throw new InvalidArgumentException(__('diyar.catalog.review_comment_empty'));
        }
    }

    public function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }

    public function duplicateReviewException(): ConflictHttpException
    {
        return new ConflictHttpException(__('diyar.catalog.review_already_exists'));
    }
}
