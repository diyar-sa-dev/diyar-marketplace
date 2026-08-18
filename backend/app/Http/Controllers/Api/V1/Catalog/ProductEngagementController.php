<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreProductReviewRequest;
use App\Http\Resources\ProductReviewResource;
use App\Services\Catalog\ProductEngagementService;
use App\Services\Media\MediaUploadService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ProductEngagementController extends Controller
{
    public function __construct(
        private readonly ProductEngagementService $engagement,
    ) {}

    public function reviews(Request $request, string $id): JsonResponse
    {
        $product = $this->engagement->findPublicProduct($id);
        $product->loadMissing('vendorAccount');
        $paginator = $this->engagement->paginateReviews(
            $product,
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 5),
        );

        $myReview = $request->user()
            ? $this->engagement->findUserReview($request->user(), $product)
            : null;

        $media = app(MediaUploadService::class);
        $vendor = $product->vendorAccount;

        return ApiResponse::success(data: [
            'items' => ProductReviewResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'my_review' => $myReview ? new ProductReviewResource($myReview) : null,
            'vendor_store' => $vendor !== null ? [
                'name' => $vendor->business_name,
                'logo_url' => $media->url($vendor->logo_path),
            ] : null,
        ]);
    }

    public function storeReview(StoreProductReviewRequest $request, string $id): JsonResponse
    {
        $product = $this->engagement->findPublicProduct($id);

        try {
            $review = $this->engagement->createReview(
                $request->user(),
                $product,
                (int) $request->validated('rating'),
                $request->validated('comment'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['review' => new ProductReviewResource($review)],
            message: __('diyar.catalog.review_saved'),
        );
    }

    public function updateReview(StoreProductReviewRequest $request, string $id): JsonResponse
    {
        $product = $this->engagement->findPublicProduct($id);

        try {
            $review = $this->engagement->updateReview(
                $request->user(),
                $product,
                (int) $request->validated('rating'),
                $request->validated('comment'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['review' => new ProductReviewResource($review)],
            message: __('diyar.catalog.review_updated'),
        );
    }

    public function destroyReview(Request $request, string $id): JsonResponse
    {
        $product = $this->engagement->findPublicProduct($id);

        try {
            $this->engagement->deleteReview($request->user(), $product);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(message: __('diyar.catalog.review_deleted'));
    }

    public function toggleLike(Request $request, string $id): JsonResponse
    {
        $product = $this->engagement->findPublicProduct($id);
        $result = $this->engagement->toggleLike($request->user(), $product);

        return ApiResponse::success(data: $result);
    }

    public function toggleWishlist(Request $request, string $id): JsonResponse
    {
        $product = $this->engagement->findPublicProduct($id);
        $result = $this->engagement->toggleWishlist($request->user(), $product);

        return ApiResponse::success(data: $result);
    }
}
