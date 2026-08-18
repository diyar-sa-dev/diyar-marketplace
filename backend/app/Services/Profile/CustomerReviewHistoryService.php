<?php

namespace App\Services\Profile;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\StoreReview;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Services\Media\MediaUploadService;
use App\Services\Review\OrderFulfillmentReviewEligibility;
use App\Services\Review\ProductReviewEligibilityService;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class CustomerReviewHistoryService
{
    public function __construct(
        private readonly OrderFulfillmentReviewEligibility $eligibility,
        private readonly ProductReviewEligibilityService $productReviewEligibility,
        private readonly VendorOwnership $vendorOwnership,
        private readonly MediaUploadService $media,
    ) {}

    /**
     * @return array{
     *   summary: array<string, mixed>,
     *   items: list<array<string, mixed>>,
     *   pagination: array<string, int>
     * }
     */
    public function list(User $user, string $status, string $type, int $page, int $perPage): array
    {
        $status = in_array($status, ['published', 'pending'], true) ? $status : 'published';
        $type = in_array($type, ['all', 'product', 'store', 'service'], true) ? $type : 'all';
        $page = max($page, 1);
        $perPage = min(max($perPage, 1), 20);

        $summary = $this->summary($user);

        if ($status === 'published') {
            return $this->paginatePublished($user, $type, $page, $perPage, $summary);
        }

        return $this->paginatePending($user, $type, $page, $perPage, $summary);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findPublished(User $user, string $type, string $id): ?array
    {
        if ($type === 'product') {
            $review = ProductReview::query()
                ->where('user_id', $user->id)
                ->whereKey($id)
                ->with([
                    'product' => fn ($query) => $query->withTrashed()->with(['images.mediaFile', 'vendorAccount']),
                    'vendorRepliedBy:id,name',
                ])
                ->first();

            return $review !== null
                ? $this->hydratePublishedProductReviews(collect([$review]))->first()
                : null;
        }

        if ($type === 'store') {
            $review = StoreReview::query()
                ->where('user_id', $user->id)
                ->whereKey($id)
                ->with(['vendorAccount', 'order:id,order_number', 'vendorRepliedBy:id,name'])
                ->first();

            return $review !== null
                ? $this->hydratePublishedStoreReviews(collect([$review]))->first()
                : null;
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(User $user): array
    {
        $publishedProduct = ProductReview::query()->where('user_id', $user->id)->count();
        $publishedStore = StoreReview::query()->where('user_id', $user->id)->count();
        $pendingProduct = $this->pendingProductOpportunities($user)->count();
        $pendingStore = $this->pendingStoreOpportunities($user)->count();

        return [
            'published_count' => $publishedProduct + $publishedStore,
            'pending_count' => $pendingProduct + $pendingStore,
            'published_by_type' => [
                'product' => $publishedProduct,
                'store' => $publishedStore,
                'service' => 0,
            ],
            'pending_by_type' => [
                'product' => $pendingProduct,
                'store' => $pendingStore,
                'service' => 0,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $summary
     * @return array{summary: array<string, mixed>, items: list<array<string, mixed>>, pagination: array<string, int>}
     */
    private function paginatePublished(User $user, string $type, int $page, int $perPage, array $summary): array
    {
        if ($type === 'service') {
            return $this->emptyPage($summary, $page, $perPage);
        }

        if ($type === 'product') {
            $paginator = ProductReview::query()
                ->where('user_id', $user->id)
                ->with([
                    'product' => fn ($query) => $query->withTrashed()->with(['images.mediaFile', 'vendorAccount']),
                    'vendorRepliedBy:id,name',
                ])
                ->latest()
                ->paginate(perPage: $perPage, page: $page);

            return $this->formatPublishedPage(
                $summary,
                $this->hydratePublishedProductReviews($paginator->getCollection()),
                $paginator,
            );
        }

        if ($type === 'store') {
            $paginator = StoreReview::query()
                ->where('user_id', $user->id)
                ->with(['vendorAccount', 'order:id,order_number', 'vendorRepliedBy:id,name'])
                ->latest()
                ->paginate(perPage: $perPage, page: $page);

            return $this->formatPublishedPage(
                $summary,
                $this->hydratePublishedStoreReviews($paginator->getCollection()),
                $paginator,
            );
        }

        $union = DB::query()->fromSub(
            ProductReview::query()
                ->selectRaw("id, 'product' as review_type, created_at")
                ->where('user_id', $user->id)
                ->unionAll(
                    StoreReview::query()
                        ->selectRaw("id, 'store' as review_type, created_at")
                        ->where('user_id', $user->id),
                ),
            'customer_reviews',
        );

        $total = (clone $union)->count();
        $rows = $union
            ->orderByDesc('created_at')
            ->forPage($page, $perPage)
            ->get();

        $productIds = $rows->where('review_type', 'product')->pluck('id')->all();
        $storeIds = $rows->where('review_type', 'store')->pluck('id')->all();

        $productsById = $this->loadPublishedProductReviews($productIds)->keyBy('id');
        $storesById = $this->loadPublishedStoreReviews($storeIds)->keyBy('id');

        $items = $rows
            ->map(function ($row) use ($productsById, $storesById) {
                if ($row->review_type === 'product') {
                    return $productsById->get($row->id);
                }

                return $storesById->get($row->id);
            })
            ->filter()
            ->values()
            ->all();

        $paginator = new Paginator($items, $total, $perPage, $page);

        return $this->formatPublishedPage($summary, collect($items), $paginator);
    }

    /**
     * @param  array<string, mixed>  $summary
     * @return array{summary: array<string, mixed>, items: list<array<string, mixed>>, pagination: array<string, int>}
     */
    private function paginatePending(User $user, string $type, int $page, int $perPage, array $summary): array
    {
        if ($type === 'service') {
            return $this->emptyPage($summary, $page, $perPage);
        }

        $items = match ($type) {
            'product' => $this->pendingProductOpportunities($user),
            'store' => $this->pendingStoreOpportunities($user),
            default => $this->pendingProductOpportunities($user)
                ->concat($this->pendingStoreOpportunities($user))
                ->sortByDesc('sort_at')
                ->values(),
        };

        $total = $items->count();
        $pageItems = $items->slice(($page - 1) * $perPage, $perPage)->values()->all();

        return [
            'summary' => $summary,
            'items' => $pageItems,
            'pagination' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                'total' => $total,
            ],
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function pendingProductOpportunities(User $user): Collection
    {
        $reviewedProductIds = ProductReview::query()
            ->where('user_id', $user->id)
            ->pluck('product_id');

        return OrderItem::query()
            ->whereHas('vendorOrder', fn (Builder $query) => $this->productReviewEligibility->eligibleVendorOrderQuery($query, $user))
            ->when($reviewedProductIds->isNotEmpty(), fn (Builder $query) => $query->whereNotIn('product_id', $reviewedProductIds))
            ->with([
                'product' => fn ($query) => $query->withTrashed()->with(['images.mediaFile', 'vendorAccount']),
                'vendorOrder.order',
            ])
            ->latest()
            ->get()
            ->filter(function (OrderItem $item) use ($user) {
                $product = $item->product;

                return $product !== null && ! $this->vendorOwnership->userOwnsProduct($user, $product);
            })
            ->unique('product_id')
            ->map(fn (OrderItem $item) => $this->mapPendingProductItem($item))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function pendingStoreOpportunities(User $user): Collection
    {
        $existingKeys = StoreReview::query()
            ->where('user_id', $user->id)
            ->get(['order_id', 'vendor_account_id'])
            ->map(fn (StoreReview $review) => $review->order_id.'|'.$review->vendor_account_id)
            ->flip();

        return VendorOrder::query()
            ->whereHas('order', fn (Builder $query) => $query->where('user_id', $user->id))
            ->with(['vendorAccount', 'order'])
            ->latest()
            ->get()
            ->filter(function (VendorOrder $vendorOrder) use ($user, $existingKeys) {
                $key = $vendorOrder->order_id.'|'.$vendorOrder->vendor_account_id;

                if ($existingKeys->has($key)) {
                    return false;
                }

                if ($this->vendorOwnership->userOwnsVendorAccount($user, $vendorOrder->vendor_account_id)) {
                    return false;
                }

                $vendorOrder->loadMissing('order.payment');

                return $this->eligibility->isVendorOrderEligible($vendorOrder, $vendorOrder->order);
            })
            ->map(fn (VendorOrder $vendorOrder) => $this->mapPendingStoreItem($vendorOrder))
            ->values();
    }

    /**
     * @param  list<string>  $ids
     * @return Collection<int, array<string, mixed>>
     */
    private function loadPublishedProductReviews(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return $this->hydratePublishedProductReviews(
            ProductReview::query()
                ->whereIn('id', $ids)
                ->with([
                    'product' => fn ($query) => $query->withTrashed()->with(['images.mediaFile', 'vendorAccount']),
                    'vendorRepliedBy:id,name',
                ])
                ->get(),
        );
    }

    /**
     * @param  list<string>  $ids
     * @return Collection<int, array<string, mixed>>
     */
    private function loadPublishedStoreReviews(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return $this->hydratePublishedStoreReviews(
            StoreReview::query()
                ->whereIn('id', $ids)
                ->with(['vendorAccount', 'order:id,order_number', 'vendorRepliedBy:id,name'])
                ->get(),
        );
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function hydratePublishedProductReviews(Collection $reviews): Collection
    {
        return $reviews->map(fn (ProductReview $review) => [
            'type' => 'product',
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
            'vendor_reply' => $review->vendor_reply,
            'vendor_replied_at' => $review->vendor_replied_at?->toIso8601String(),
            'vendor_replied_by' => $review->vendor_reply !== null
                ? $review->product?->vendorAccount?->business_name
                : null,
            'product' => $this->mapProductSubject($review->product, fallbackName: null),
            'store' => $this->mapStoreSubject($review->product?->vendorAccount),
            'order_id' => null,
            'order_number' => null,
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function hydratePublishedStoreReviews(Collection $reviews): Collection
    {
        return $reviews->map(fn (StoreReview $review) => [
            'type' => 'store',
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
            'vendor_reply' => $review->vendor_reply,
            'vendor_replied_at' => $review->vendor_replied_at?->toIso8601String(),
            'vendor_replied_by' => $review->vendor_reply !== null
                ? $review->vendorAccount?->business_name
                : null,
            'store' => $this->mapStoreSubject($review->vendorAccount),
            'order_id' => $review->order_id,
            'order_number' => $review->order?->order_number,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPendingProductItem(OrderItem $item): array
    {
        $vendorOrder = $item->vendorOrder;
        $order = $vendorOrder?->order;

        return [
            'type' => 'product',
            'pending_key' => 'product:'.$item->product_id,
            'sort_at' => $vendorOrder?->updated_at?->toIso8601String() ?? $order?->created_at?->toIso8601String(),
            'order_id' => $order?->id,
            'order_number' => $order?->order_number,
            'order_item_id' => $item->id,
            'product' => $this->mapProductSubject(
                $item->product,
                fallbackName: $item->product_name,
                fallbackSlug: $item->product_slug,
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPendingStoreItem(VendorOrder $vendorOrder): array
    {
        $order = $vendorOrder->order;

        return [
            'type' => 'store',
            'pending_key' => 'store:'.$vendorOrder->id,
            'sort_at' => $vendorOrder->updated_at?->toIso8601String() ?? $order?->created_at?->toIso8601String(),
            'order_id' => $order?->id,
            'order_number' => $order?->order_number,
            'vendor_order_id' => $vendorOrder->id,
            'store' => $this->mapStoreSubject($vendorOrder->vendorAccount),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapProductSubject(
        ?Product $product,
        ?string $fallbackName = null,
        ?string $fallbackSlug = null,
    ): ?array {
        if ($product === null && $fallbackName === null) {
            return null;
        }

        $firstImage = $product?->relationLoaded('images') ? $product->images->first() : null;
        $imageUrl = $firstImage?->relationLoaded('mediaFile')
            ? $this->media->url($firstImage->mediaFile->path)
            : null;

        return [
            'id' => $product?->id,
            'name' => $product?->name ?? $fallbackName,
            'slug' => $product?->slug ?? $fallbackSlug,
            'image_url' => $imageUrl,
            'available' => $product !== null && $product->deleted_at === null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapStoreSubject(?VendorAccount $vendor): ?array
    {
        if ($vendor === null) {
            return null;
        }

        return [
            'id' => $vendor->id,
            'name' => $vendor->business_name,
            'slug' => $vendor->slug,
            'logo_url' => $this->media->url($vendor->logo_path),
        ];
    }

    /**
     * @param  array<string, mixed>  $summary
     * @return array{summary: array<string, mixed>, items: list<array<string, mixed>>, pagination: array<string, int>}
     */
    private function formatPublishedPage(array $summary, Collection $items, LengthAwarePaginator $paginator): array
    {
        return [
            'summary' => $summary,
            'items' => $items->values()->all(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $summary
     * @return array{summary: array<string, mixed>, items: list<array<string, mixed>>, pagination: array<string, int>}
     */
    private function emptyPage(array $summary, int $page, int $perPage): array
    {
        return [
            'summary' => $summary,
            'items' => [],
            'pagination' => [
                'current_page' => $page,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ],
        ];
    }
}
