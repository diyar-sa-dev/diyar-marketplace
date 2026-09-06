<?php

namespace App\Http\Controllers\Api\V1\B2b;

use App\Http\Controllers\Controller;
use App\Http\Requests\B2b\StoreB2bCompanyReviewRequest;
use App\Http\Resources\B2bCompanyReviewResource;
use App\Services\B2b\B2bCompanyReviewService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class B2bCompanyReviewController extends Controller
{
    public function __construct(
        private readonly B2bCompanyReviewService $reviews,
    ) {}

    public function index(Request $request, string $slug): JsonResponse
    {
        $company = $this->reviews->findPublishedCompanyBySlug($slug);
        $paginator = $this->reviews->paginateForCompany(
            $company,
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 5),
        );

        return ApiResponse::success(data: [
            'items' => B2bCompanyReviewResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(StoreB2bCompanyReviewRequest $request, string $slug): JsonResponse
    {
        $company = $this->reviews->findPublishedCompanyBySlug($slug);

        try {
            $review = $this->reviews->createReview(
                $request->user(),
                $company,
                $request->validated('b2b_lead_id'),
                (int) $request->validated('rating'),
                $request->validated('comment'),
            );
        } catch (NotFoundHttpException|AccessDeniedHttpException|InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['review' => new B2bCompanyReviewResource($review)],
            message: __('diyar.b2b.review.saved'),
        );
    }
}
