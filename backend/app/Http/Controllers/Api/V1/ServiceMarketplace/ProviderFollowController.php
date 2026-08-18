<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Services\ServiceMarketplace\ProviderFollowService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ProviderFollowController extends Controller
{
    public function __construct(
        private readonly ProviderFollowService $follows,
    ) {}

    public function follow(Request $request, string $slug): JsonResponse
    {
        try {
            $summary = $this->follows->follow($request->user(), $slug);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['follow' => $summary],
            message: __('diyar.services.followed'),
        );
    }

    public function unfollow(Request $request, string $slug): JsonResponse
    {
        $summary = $this->follows->unfollow($request->user(), $slug);

        return ApiResponse::success(
            ['follow' => $summary],
            message: __('diyar.services.unfollowed'),
        );
    }
}
