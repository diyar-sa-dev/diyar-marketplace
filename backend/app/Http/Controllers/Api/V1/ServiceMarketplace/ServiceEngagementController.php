<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Services\ServiceMarketplace\ServiceEngagementService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceEngagementController extends Controller
{
    public function __construct(
        private readonly ServiceEngagementService $engagement,
    ) {}

    public function toggleWishlist(Request $request, string $identifier): JsonResponse
    {
        $service = $this->engagement->findPublicService($identifier);
        $result = $this->engagement->toggleWishlist($request->user(), $service);

        return ApiResponse::success(data: $result);
    }
}
