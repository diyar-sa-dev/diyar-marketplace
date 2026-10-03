<?php

namespace App\Domains\Reviews\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Domains\Reviews\Services\StoreReviewService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class OrderStoreReviewController extends Controller
{
    public function __construct(
        private readonly StoreReviewService $storeReviews,
    ) {}

    public function eligibility(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        try {
            $items = $this->storeReviews->eligibilityForOrder(request()->user(), $order);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 403);
        }

        return ApiResponse::success(data: [
            'items' => $items,
        ]);
    }
}
