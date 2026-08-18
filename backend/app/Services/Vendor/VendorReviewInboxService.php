<?php

namespace App\Services\Vendor;

use App\Enums\VendorTeamRole;
use App\Models\ProductReview;
use App\Models\StoreReview;
use App\Models\User;
use App\Models\VendorAccount;
use App\Services\Media\MediaUploadService;
use Illuminate\Support\Collection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class VendorReviewInboxService
{
    public function __construct(
        private readonly VendorAccessService $access,
        private readonly MediaUploadService $media,
    ) {}

    /**
     * @return array{items: list<array<string, mixed>>, pagination: array<string, int>}
     */
    public function list(User $user, int $page = 1, int $perPage = 10, ?string $type = null): array
    {
        $vendorAccount = $this->access->assertPermission($user, 'reviews');
        $role = $this->access->resolveRole($user);

        $productReviews = $type === 'store'
            ? collect()
            : ProductReview::query()
                ->whereHas('product', fn ($query) => $query->where('vendor_account_id', $vendorAccount->id))
                ->with(['user:id,name,avatar_path', 'product:id,name,slug'])
                ->latest()
                ->get()
                ->map(fn (ProductReview $review) => $this->mapProductReview($review, $role, $vendorAccount->business_name));

        $storeReviews = $type === 'product'
            ? collect()
            : StoreReview::query()
                ->where('vendor_account_id', $vendorAccount->id)
                ->with(['user:id,name,avatar_path'])
                ->latest()
                ->get()
                ->map(fn (StoreReview $review) => $this->mapStoreReview($review, $role, $vendorAccount->business_name));

        /** @var Collection<int, array<string, mixed>> $merged */
        $merged = $productReviews->concat($storeReviews)->sortByDesc('created_at')->values();
        $total = $merged->count();
        $offset = ($page - 1) * $perPage;
        $items = $merged->slice($offset, $perPage)->values()->all();

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                'total' => $total,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function reply(User $user, string $type, string $reviewId, string $replyBody): array
    {
        $vendorAccount = $this->access->assertPermission($user, 'reviews');
        $role = $this->access->resolveRole($user);

        if ($role === null || ! VendorTeamPermissions::canReplyToReviews($role)) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return match ($type) {
            'product' => $this->replyProductReview($user, $vendorAccount, $reviewId, $replyBody),
            'store' => $this->replyStoreReview($user, $vendorAccount, $reviewId, $replyBody),
            default => throw new InvalidArgumentException(__('diyar.auth.forbidden')),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function replyProductReview(User $user, VendorAccount $vendorAccount, string $reviewId, string $replyBody): array
    {
        $review = ProductReview::query()
            ->whereKey($reviewId)
            ->whereHas('product', fn ($query) => $query->where('vendor_account_id', $vendorAccount->id))
            ->with(['user:id,name', 'product:id,name,slug'])
            ->firstOrFail();

        if ($review->vendor_reply !== null) {
            throw new InvalidArgumentException(__('diyar.vendor.reviews.already_replied'));
        }

        $review->update([
            'vendor_reply' => trim($replyBody),
            'vendor_replied_at' => now(),
            'vendor_replied_by_user_id' => $user->id,
        ]);

        return $this->mapProductReview(
            $review->fresh(['user', 'product']),
            $this->access->resolveRole($user),
            $vendorAccount->business_name,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function replyStoreReview(User $user, VendorAccount $vendorAccount, string $reviewId, string $replyBody): array
    {
        $review = StoreReview::query()
            ->whereKey($reviewId)
            ->where('vendor_account_id', $vendorAccount->id)
            ->with(['user:id,name'])
            ->firstOrFail();

        if ($review->vendor_reply !== null) {
            throw new InvalidArgumentException(__('diyar.vendor.reviews.already_replied'));
        }

        $review->update([
            'vendor_reply' => trim($replyBody),
            'vendor_replied_at' => now(),
            'vendor_replied_by_user_id' => $user->id,
        ]);

        return $this->mapStoreReview(
            $review->fresh(['user']),
            $this->access->resolveRole($user),
            $vendorAccount->business_name,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function mapProductReview(ProductReview $review, ?VendorTeamRole $role, ?string $vendorStoreName = null): array
    {
        $canReply = $role !== null
            && VendorTeamPermissions::canReplyToReviews($role)
            && $review->vendor_reply === null;

        return [
            'id' => $review->id,
            'type' => 'product',
            'rating' => $review->rating,
            'comment' => $review->comment,
            'vendor_reply' => $review->vendor_reply,
            'vendor_replied_at' => $review->vendor_replied_at?->toIso8601String(),
            'vendor_replied_by' => $review->vendor_reply !== null ? $vendorStoreName : null,
            'created_at' => $review->created_at?->toIso8601String(),
            'customer_name' => $review->user?->name,
            'customer_avatar_url' => $this->media->url($review->user?->avatar_path),
            'target_label' => $review->product?->name,
            'target_slug' => $review->product?->slug,
            'can_reply' => $canReply,
            'can_edit' => false,
            'can_delete' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapStoreReview(StoreReview $review, ?VendorTeamRole $role, ?string $vendorStoreName = null): array
    {
        $canReply = $role !== null
            && VendorTeamPermissions::canReplyToReviews($role)
            && $review->vendor_reply === null;

        return [
            'id' => $review->id,
            'type' => 'store',
            'rating' => $review->rating,
            'comment' => $review->comment,
            'vendor_reply' => $review->vendor_reply,
            'vendor_replied_at' => $review->vendor_replied_at?->toIso8601String(),
            'vendor_replied_by' => $review->vendor_reply !== null ? $vendorStoreName : null,
            'created_at' => $review->created_at?->toIso8601String(),
            'customer_name' => $review->user?->name,
            'customer_avatar_url' => $this->media->url($review->user?->avatar_path),
            'target_label' => null,
            'target_slug' => null,
            'can_reply' => $canReply,
            'can_edit' => false,
            'can_delete' => false,
        ];
    }
}
