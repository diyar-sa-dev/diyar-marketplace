<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductReviewResource;
use App\Http\Resources\ProviderReviewResource;
use App\Http\Resources\StoreReviewResource;
use App\Models\ProductReview;
use App\Models\ProviderReview;
use App\Models\StoreReview;
use App\Services\Admin\AdminReviewModerationService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminReviewController extends Controller
{
    public function __construct(
        private readonly AdminReviewModerationService $reviews,
    ) {}

    public function productReviews(Request $request): JsonResponse
    {
        $query = ProductReview::query()->with(['user', 'product']);

        if ($rating = $request->integer('rating')) {
            $query->where('rating', $rating);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('product', fn ($product) => $product->where('name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('product_reviews', ProductReviewResource::collection($paginator->items()), $paginator);
    }

    public function storeReviews(Request $request): JsonResponse
    {
        $query = StoreReview::query()->with(['user', 'vendorAccount']);

        if ($rating = $request->integer('rating')) {
            $query->where('rating', $rating);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('vendorAccount', fn ($vendor) => $vendor->where('business_name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('store_reviews', StoreReviewResource::collection($paginator->items()), $paginator);
    }

    public function providerReviews(Request $request): JsonResponse
    {
        $query = ProviderReview::query()->with(['user', 'providerAccount', 'service']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($rating = $request->integer('rating')) {
            $query->where('rating', $rating);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('providerAccount', fn ($provider) => $provider->where('business_name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('provider_reviews', ProviderReviewResource::collection($paginator->items()), $paginator);
    }

    public function hideProviderReview(Request $request, ProviderReview $providerReview): JsonResponse
    {
        $updated = $this->reviews->hideProviderReview(
            review: $providerReview,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['review' => new ProviderReviewResource($updated)]);
    }

    public function unhideProviderReview(Request $request, ProviderReview $providerReview): JsonResponse
    {
        $updated = $this->reviews->unhideProviderReview(
            review: $providerReview,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['review' => new ProviderReviewResource($updated)]);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
