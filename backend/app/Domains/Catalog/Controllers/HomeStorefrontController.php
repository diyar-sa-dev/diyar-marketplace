<?php

namespace App\Domains\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Catalog\Services\HomeStorefrontService;
use App\Core\Support\Api\ApiResponse;
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
