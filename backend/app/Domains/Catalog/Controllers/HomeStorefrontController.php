<?php

namespace App\Domains\Catalog\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Catalog\Services\HomeStorefrontService;
use App\Http\Controllers\Controller;
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
