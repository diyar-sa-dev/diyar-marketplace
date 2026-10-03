<?php

namespace App\Domains\Reviews\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Reviews\Services\CustomerReviewHistoryService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerReviewController extends Controller
{
    public function __construct(
        private readonly CustomerReviewHistoryService $reviews,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $result = $this->reviews->list(
            user: $request->user(),
            status: (string) $request->query('status', 'published'),
            type: (string) $request->query('type', 'all'),
            page: (int) $request->query('page', 1),
            perPage: (int) $request->query('per_page', 10),
        );

        return ApiResponse::success(data: $result);
    }

    public function show(Request $request, string $type, string $id): JsonResponse
    {
        $review = $this->reviews->findPublished($request->user(), $type, $id);

        if ($review === null) {
            return ApiResponse::error(__('diyar.catalog.review_not_found'), 404);
        }

        return ApiResponse::success(data: ['review' => $review]);
    }
}
