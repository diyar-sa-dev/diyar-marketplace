<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Services\Storefront\HomeStorefrontService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeStorefrontController extends Controller
{
    public function __construct(
        private readonly HomeStorefrontService $home,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success(data: [
            'sections' => $this->home->build($request->user()),
        ]);
    }
}
