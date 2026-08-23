<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\CatalogSearchRequest;
use App\Services\Catalog\CatalogSearchService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class CatalogSearchController extends Controller
{
    public function __construct(
        private readonly CatalogSearchService $search,
    ) {}

    public function __invoke(CatalogSearchRequest $request): JsonResponse
    {
        $payload = $this->search->search($request->validatedFilters(), $request->user());

        return ApiResponse::success(data: $payload);
    }
}
