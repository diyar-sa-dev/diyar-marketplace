<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceCardResource;
use App\Http\Resources\ServiceDetailResource;
use App\Services\ServiceMarketplace\ServiceCatalogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ServiceController extends Controller
{
    public function __construct(
        private readonly ServiceCatalogService $services,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->services->listPublic($request->query());

        return ApiResponse::success(data: $this->paginatedServices($paginator));
    }

    public function show(string $identifier): JsonResponse
    {
        $service = $this->services->findPublic($identifier);

        return ApiResponse::success(data: [
            'service' => new ServiceDetailResource($service),
        ]);
    }

    public function related(string $identifier): JsonResponse
    {
        $service = $this->services->findPublic($identifier);
        $related = $this->services->relatedServices($service);

        return ApiResponse::success(data: [
            'items' => ServiceCardResource::collection($related)->resolve(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedServices(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ServiceCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
