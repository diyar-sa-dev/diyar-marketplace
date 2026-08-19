<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\CreateProviderReviewRequest;
use App\Http\Requests\ServiceMarketplace\ProviderReviewResponseRequest;
use App\Http\Requests\ServiceMarketplace\UpdateProviderReviewRequest;
use App\Http\Resources\ProviderReviewResource;
use App\Http\Resources\ProviderReviewSummaryResource;
use App\Models\ProviderReview;
use App\Services\ServiceMarketplace\ProviderAccountResolver;
use App\Services\ServiceMarketplace\ProviderReviewService;
use App\Services\ServiceMarketplace\ServiceBookingService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ProviderReviewController extends Controller
{
    public function __construct(
        private readonly ProviderReviewService $reviews,
        private readonly ServiceBookingService $bookings,
    ) {}

    public function index(Request $request, string $slug): JsonResponse
    {
        $provider = $this->reviews->findActiveProviderBySlug($slug);
        $paginator = $this->reviews->paginatePublicReviews(
            $provider,
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 10),
        );
        $summary = $this->reviews->ratingSummary($provider);

        return ApiResponse::success(data: [
            'items' => ProviderReviewResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'summary' => (new ProviderReviewSummaryResource($summary))->resolve(),
        ]);
    }

    public function store(CreateProviderReviewRequest $request, string $serviceBooking): JsonResponse
    {
        $booking = $this->bookings->findForParticipant($request->user(), $serviceBooking);

        try {
            $review = $this->reviews->createForBooking(
                $request->user(),
                $booking,
                (int) $request->validated('rating'),
                $request->validated('title'),
                $request->validated('comment'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['review' => new ProviderReviewResource($review)],
            message: __('diyar.provider_review.saved'),
        );
    }

    public function update(UpdateProviderReviewRequest $request, ProviderReview $review): JsonResponse
    {
        try {
            $updated = $this->reviews->updateReview(
                $request->user(),
                $review,
                (int) $request->validated('rating'),
                $request->validated('title'),
                $request->validated('comment'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['review' => new ProviderReviewResource($updated)],
            message: __('diyar.provider_review.updated'),
        );
    }

    public function destroy(Request $request, ProviderReview $review): JsonResponse
    {
        $this->reviews->deleteReview($request->user(), $review);

        return ApiResponse::success(message: __('diyar.provider_review.deleted'));
    }

    public function respond(ProviderReviewResponseRequest $request, ProviderReview $review): JsonResponse
    {
        try {
            $updated = $this->reviews->respond(
                $request->user(),
                $review,
                (string) $request->validated('response'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['review' => new ProviderReviewResource($updated)],
            message: __('diyar.provider_review.response_saved'),
        );
    }

    public function providerInbox(Request $request): JsonResponse
    {
        $paginator = $this->reviews->paginateForProviderDashboard(
            $request->user(),
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 10),
        );

        $provider = ProviderAccountResolver::forUser($request->user());
        $summary = $this->reviews->ratingSummary($provider);

        return ApiResponse::success(data: [
            'items' => ProviderReviewResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'summary' => (new ProviderReviewSummaryResource($summary))->resolve(),
        ]);
    }
}
