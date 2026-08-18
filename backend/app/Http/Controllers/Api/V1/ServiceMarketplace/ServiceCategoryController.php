<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceCategoryResource;
use App\Services\ServiceMarketplace\ServiceCategoryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class ServiceCategoryController extends Controller
{
    public function __construct(
        private readonly ServiceCategoryService $categories,
    ) {}

    public function index(): JsonResponse
    {
        $items = $this->categories->listActive();

        return ApiResponse::success(data: [
            'categories' => ServiceCategoryResource::collection($items)->resolve(),
        ]);
    }
}
