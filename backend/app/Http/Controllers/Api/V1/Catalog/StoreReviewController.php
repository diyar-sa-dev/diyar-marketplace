<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReview\StoreStoreReviewRequest;
use App\Http\Requests\StoreReview\UpdateStoreReviewRequest;
use App\Http\Resources\StoreReviewResource;
use App\Http\Resources\StoreReviewSummaryResource;
use App\Models\StoreReview;
use App\Services\StoreReview\StoreReviewService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class StoreReviewController extends Controller
{
    public function __construct(
        private readonly StoreReviewService $storeReviews,
    ) {}

    public function index(Request $request, string $slug): JsonResponse
    {
        $vendor = $this->storeReviews->findActiveVendorBySlug($slug);
        $paginator = $this->storeReviews->paginateReviews(
            $vendor,
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 5),
        );
        $summary = $this->storeReviews->ratingSummary($vendor);

        return ApiResponse::success(data: [
            'items' => StoreReviewResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'summary' => (new StoreReviewSummaryResource($summary))->resolve(),
        ]);
    }

    public function store(StoreStoreReviewRequest $request, string $slug): JsonResponse
    {
        $vendor = $this->storeReviews->findActiveVendorBySlug($slug);

        try {
            $review = $this->storeReviews->createReview(
                $request->user(),
                $vendor,
                $request->validated('order_id'),
                (int) $request->validated('rating'),
                $request->validated('comment'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['review' => new StoreReviewResource($review)],
            message: __('diyar.store_review.saved'),
        );
    }

    public function update(UpdateStoreReviewRequest $request, StoreReview $review): JsonResponse
    {
        try {
            $updated = $this->storeReviews->updateReview(
                $request->user(),
                $review,
                (int) $request->validated('rating'),
                $request->validated('comment'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['review' => new StoreReviewResource($updated)],
            message: __('diyar.store_review.updated'),
        );
    }

    public function destroy(Request $request, StoreReview $review): JsonResponse
    {
        $this->storeReviews->deleteReview($request->user(), $review);

        return ApiResponse::success(message: __('diyar.store_review.deleted'));
    }
}
