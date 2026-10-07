<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Resources\ServiceCategoryResource;
use App\Domains\ServicesMarketplace\Services\ServiceCategoryService;
use App\Http\Controllers\Controller;
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
