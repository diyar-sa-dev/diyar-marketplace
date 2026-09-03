<?php

namespace App\Services\Profile;

use App\Enums\B2bLeadStatus;
use App\Enums\ProviderReviewStatus;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\B2bCompany;
use App\Models\B2bCompanyReview;
use App\Models\B2bLead;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\ProviderAccount;
use App\Models\ProviderReview;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\StoreReview;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Services\Media\MediaUploadService;
use App\Services\Review\OrderFulfillmentReviewEligibility;
use App\Services\Review\ProductReviewEligibilityService;
use App\Support\Media\CmsImageUrl;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        $type = in_array($type, ['all', 'product', 'store', 'service', 'b2b'], true) ? $type : 'all';
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

        if ($type === 'service') {
            $review = ProviderReview::query()
                ->where('user_id', $user->id)
                ->where('status', ProviderReviewStatus::Published)
                ->whereKey($id)
                ->with(['service', 'providerAccount', 'serviceBooking.serviceRequest', 'serviceBooking.service'])
                ->first();

            return $review !== null
                ? $this->hydratePublishedServiceReviews(collect([$review]))->first()
                : null;
        }

        if ($type === 'b2b') {
            $review = B2bCompanyReview::query()
                ->where('user_id', $user->id)
                ->whereKey($id)
                ->with(['company', 'lead:id,project_type'])
                ->first();

            return $review !== null
                ? $this->hydratePublishedB2bReviews(collect([$review]))->first()
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
        $publishedService = ProviderReview::query()
            ->where('user_id', $user->id)
            ->where('status', ProviderReviewStatus::Published)
            ->count();
        $publishedB2b = B2bCompanyReview::query()->where('user_id', $user->id)->count();
        $pendingProduct = $this->pendingProductOpportunities($user)->count();
        $pendingStore = $this->pendingStoreOpportunities($user)->count();
        $pendingService = $this->pendingServiceOpportunities($user)->count();
        $pendingB2b = $this->pendingB2bOpportunities($user)->count();

        return [
            'published_count' => $publishedProduct + $publishedStore + $publishedService + $publishedB2b,
            'pending_count' => $pendingProduct + $pendingStore + $pendingService + $pendingB2b,
            'published_by_type' => [
                'product' => $publishedProduct,
                'store' => $publishedStore,
                'service' => $publishedService,
                'b2b' => $publishedB2b,
            ],
            'pending_by_type' => [
                'product' => $pendingProduct,
                'store' => $pendingStore,
                'service' => $pendingService,
                'b2b' => $pendingB2b,
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
            $paginator = ProviderReview::query()
                ->where('user_id', $user->id)
                ->where('status', ProviderReviewStatus::Published)
                ->with(['service', 'providerAccount', 'serviceBooking.serviceRequest', 'serviceBooking.service'])
                ->latest()
                ->paginate(perPage: $perPage, page: $page);

            return $this->formatPublishedPage(
                $summary,
                $this->hydratePublishedServiceReviews($paginator->getCollection()),
                $paginator,
            );
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

        if ($type === 'b2b') {
            $paginator = B2bCompanyReview::query()
                ->where('user_id', $user->id)
                ->with(['company', 'lead:id,project_type'])
                ->latest()
                ->paginate(perPage: $perPage, page: $page);

            return $this->formatPublishedPage(
                $summary,
                $this->hydratePublishedB2bReviews($paginator->getCollection()),
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
                )
                ->unionAll(
                    ProviderReview::query()
                        ->selectRaw("id, 'service' as review_type, created_at")
                        ->where('user_id', $user->id)
                        ->where('status', ProviderReviewStatus::Published->value),
                )
                ->unionAll(
                    B2bCompanyReview::query()
                        ->selectRaw("id, 'b2b' as review_type, created_at")
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
        $serviceIds = $rows->where('review_type', 'service')->pluck('id')->all();
        $b2bIds = $rows->where('review_type', 'b2b')->pluck('id')->all();

        $productsById = $this->loadPublishedProductReviews($productIds)->keyBy('id');
        $storesById = $this->loadPublishedStoreReviews($storeIds)->keyBy('id');
        $servicesById = $this->loadPublishedServiceReviews($serviceIds)->keyBy('id');
        $b2bById = $this->loadPublishedB2bReviews($b2bIds)->keyBy('id');

        $items = $rows
            ->map(function ($row) use ($productsById, $storesById, $servicesById, $b2bById) {
                if ($row->review_type === 'product') {
                    return $productsById->get($row->id);
                }

                if ($row->review_type === 'store') {
                    return $storesById->get($row->id);
                }

                if ($row->review_type === 'b2b') {
                    return $b2bById->get($row->id);
                }

                return $servicesById->get($row->id);
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
        $items = match ($type) {
            'product' => $this->pendingProductOpportunities($user),
            'store' => $this->pendingStoreOpportunities($user),
            'service' => $this->pendingServiceOpportunities($user),
            'b2b' => $this->pendingB2bOpportunities($user),
            default => $this->pendingProductOpportunities($user)
                ->concat($this->pendingStoreOpportunities($user))
                ->concat($this->pendingServiceOpportunities($user))
                ->concat($this->pendingB2bOpportunities($user))
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
     * @param  list<string>  $ids
     * @return Collection<int, array<string, mixed>>
     */
    private function loadPublishedServiceReviews(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return $this->hydratePublishedServiceReviews(
            ProviderReview::query()
                ->whereIn('id', $ids)
                ->where('status', ProviderReviewStatus::Published)
                ->with(['service', 'providerAccount', 'serviceBooking.serviceRequest', 'serviceBooking.service'])
                ->get(),
        );
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function pendingB2bOpportunities(User $user): Collection
    {
        return B2bLead::query()
            ->where('user_id', $user->id)
            ->where('status', B2bLeadStatus::Accepted)
            ->whereDoesntHave('review')
            ->with(['company'])
            ->latest('updated_at')
            ->get()
            ->filter(function (B2bLead $lead) use ($user) {
                return $lead->company !== null && $lead->company->owner_user_id !== $user->id;
            })
            ->map(fn (B2bLead $lead) => $this->mapPendingB2bItem($lead))
            ->values();
    }

    /**
     * @param  list<string>  $ids
     * @return Collection<int, array<string, mixed>>
     */
    private function loadPublishedB2bReviews(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return $this->hydratePublishedB2bReviews(
            B2bCompanyReview::query()
                ->whereIn('id', $ids)
                ->with(['company', 'lead:id,project_type'])
                ->get(),
        );
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function hydratePublishedB2bReviews(Collection $reviews): Collection
    {
        return $reviews->map(fn (B2bCompanyReview $review) => [
            'type' => 'b2b',
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
            'company_reply' => $review->company_reply,
            'company_replied_at' => $review->company_replied_at?->toIso8601String(),
            'company_replied_by' => $review->company_reply !== null
                ? $review->company?->name
                : null,
            'company' => $this->mapB2bCompanySubject($review->company),
            'b2b_lead_id' => $review->b2b_lead_id,
            'project_type' => $review->lead?->project_type,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPendingB2bItem(B2bLead $lead): array
    {
        return [
            'type' => 'b2b',
            'pending_key' => 'b2b:'.$lead->id,
            'sort_at' => $lead->updated_at?->toIso8601String() ?? $lead->created_at?->toIso8601String(),
            'b2b_lead_id' => $lead->id,
            'project_type' => $lead->project_type,
            'company' => $this->mapB2bCompanySubject($lead->company),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapB2bCompanySubject(?B2bCompany $company): ?array
    {
        if ($company === null) {
            return null;
        }

        return [
            'id' => $company->id,
            'name' => $company->name,
            'slug' => $company->slug,
            'logo_url' => CmsImageUrl::resolve($company->logo),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function pendingServiceOpportunities(User $user): Collection
    {
        return ServiceBooking::query()
            ->where('user_id', $user->id)
            ->where('status', ServiceBookingStatus::Completed)
            ->where('payment_status', ServiceBookingPaymentStatus::Paid)
            ->whereDoesntHave('providerReview')
            ->with(['service', 'providerAccount', 'serviceRequest'])
            ->latest('updated_at')
            ->get()
            ->filter(function (ServiceBooking $booking) use ($user) {
                return $booking->providerAccount?->user_id !== $user->id;
            })
            ->map(fn (ServiceBooking $booking) => $this->mapPendingServiceItem($booking))
            ->values();
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
     * @return Collection<int, array<string, mixed>>
     */
    private function hydratePublishedServiceReviews(Collection $reviews): Collection
    {
        return $reviews->map(fn (ProviderReview $review) => [
            'type' => 'service',
            'id' => $review->id,
            'rating' => $review->rating,
            'title' => $review->title,
            'comment' => $review->comment,
            'created_at' => $review->created_at?->toIso8601String(),
            'updated_at' => $review->updated_at?->toIso8601String(),
            'provider_response' => $review->provider_response,
            'provider_responded_at' => $review->provider_responded_at?->toIso8601String(),
            'provider_responded_by' => $review->provider_response !== null
                ? $review->providerAccount?->business_name
                : null,
            'service' => $this->mapBookingServiceSubject($review->serviceBooking, $review->service),
            'provider' => $this->mapProviderSubject($review->providerAccount),
            'booking_id' => $review->service_booking_id,
            'booking_reference' => $review->serviceBooking?->reference,
            'booking_source' => $this->resolveBookingSource($review->serviceBooking),
            'request_reference' => $review->serviceBooking?->serviceRequest?->reference,
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
     * @return array<string, mixed>
     */
    private function mapPendingServiceItem(ServiceBooking $booking): array
    {
        return [
            'type' => 'service',
            'pending_key' => 'service:'.$booking->id,
            'sort_at' => $booking->updated_at?->toIso8601String() ?? $booking->created_at?->toIso8601String(),
            'booking_id' => $booking->id,
            'booking_reference' => $booking->reference,
            'booking_source' => $this->resolveBookingSource($booking),
            'request_reference' => $booking->serviceRequest?->reference,
            'service' => $this->mapBookingServiceSubject($booking),
            'provider' => $this->mapProviderSubject($booking->providerAccount),
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
     * @return array<string, mixed>|null
     */
    private function mapProviderSubject(?ProviderAccount $provider): ?array
    {
        if ($provider === null) {
            return null;
        }

        return [
            'id' => $provider->id,
            'name' => $provider->business_name,
            'slug' => $provider->slug,
            'logo_url' => $this->media->url($provider->avatar_path),
        ];
    }

    /**
     * @return 'rfq'|'direct'|null
     */
    private function resolveBookingSource(?ServiceBooking $booking): ?string
    {
        if ($booking === null) {
            return null;
        }

        $source = $booking->booking_source?->value;
        if ($source === 'rfq' || $source === 'direct') {
            return $source;
        }

        if ($booking->service_request_id) {
            return 'rfq';
        }

        if ($booking->service_id) {
            return 'direct';
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapBookingServiceSubject(?ServiceBooking $booking, ?Service $service = null): ?array
    {
        $resolved = $service ?? $booking?->service;
        $title = $this->firstNonEmpty([
            $resolved?->title,
            $booking?->service_title_snapshot,
            $booking?->serviceRequest?->title,
            $booking?->serviceRequest?->description,
        ]);

        return $this->mapServiceSubject($resolved, $title !== '' ? $title : null);
    }

    /**
     * @param  list<mixed>  $candidates
     */
    private function firstNonEmpty(array $candidates): string
    {
        foreach ($candidates as $candidate) {
            $value = trim((string) $candidate);
            if ($value !== '') {
                return Str::limit($value, 80, '…');
            }
        }

        return '';
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapServiceSubject(?Service $service, ?string $fallbackTitle = null): ?array
    {
        $title = $this->firstNonEmpty([$service?->title, $fallbackTitle]);
        if ($service === null && $title === '') {
            return null;
        }

        return [
            'id' => $service?->id,
            'title' => $title !== '' ? $title : null,
            'slug' => $service?->slug,
            'image_url' => $service?->cover_path ? $this->media->url($service->cover_path) : null,
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
