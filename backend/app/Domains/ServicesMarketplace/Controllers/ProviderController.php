<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Requests\StoreProviderServiceRequest;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderServiceRequest;
use App\Domains\ServicesMarketplace\Resources\ProviderPublicResource;
use App\Domains\ServicesMarketplace\Resources\ServiceCardResource;
use App\Domains\ServicesMarketplace\Resources\ServicePortfolioItemResource;
use App\Domains\ServicesMarketplace\Services\ProviderProfileService;
use App\Domains\ServicesMarketplace\Services\ProviderServiceManagementService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ProviderController extends Controller
{
    public function __construct(
        private readonly ProviderProfileService $providers,
        private readonly ProviderServiceManagementService $serviceManagement,
    ) {}

    public function show(string $slug): JsonResponse
    {
        $provider = $this->providers->findActiveBySlug($slug);

        return ApiResponse::success(data: [
            'provider' => new ProviderPublicResource($provider),
        ]);
    }

    public function services(Request $request, string $slug): JsonResponse
    {
        $provider = $this->providers->findActiveBySlug($slug);
        $paginator = $this->providers->listServices($provider, $request->query(), $request->user());

        return ApiResponse::success(data: $this->paginatedServices($paginator));
    }

    public function portfolio(string $slug): JsonResponse
    {
        $provider = $this->providers->findActiveBySlug($slug);
        $items = $provider->portfolioItems()->orderBy('sort_order')->get();

        return ApiResponse::success(data: [
            'items' => ServicePortfolioItemResource::collection($items)->resolve(),
        ]);
    }

    public function ownServices(Request $request): JsonResponse
    {
        $paginator = $this->providers->listOwnServices($request->user(), $request->query());

        return ApiResponse::success(data: $this->paginatedServices($paginator));
    }

    public function storeService(StoreProviderServiceRequest $request): JsonResponse
    {
        try {
            $service = $this->serviceManagement->create(
                $request->user(),
                $request->validated(),
                $request->file('cover'),
            );
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['service' => new ServiceCardResource($service)],
            message: __('diyar.services.catalog.created'),
            status: 201,
        );
    }

    public function updateService(UpdateProviderServiceRequest $request, string $service): JsonResponse
    {
        $model = $this->serviceManagement->findOwnedService($request->user(), $service);

        try {
            $updated = $this->serviceManagement->update(
                $request->user(),
                $model,
                $request->validated(),
                $request->file('cover'),
            );
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['service' => new ServiceCardResource($updated)],
            message: __('diyar.services.catalog.updated'),
        );
    }

    public function destroyService(Request $request, string $service): JsonResponse
    {
        $model = $this->serviceManagement->findOwnedService($request->user(), $service);

        try {
            $this->serviceManagement->delete($request->user(), $model);
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(message: __('diyar.services.catalog.deleted'));
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
