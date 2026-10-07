<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Services\ServiceEngagementService;
use App\Http\Controllers\Controller;
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
