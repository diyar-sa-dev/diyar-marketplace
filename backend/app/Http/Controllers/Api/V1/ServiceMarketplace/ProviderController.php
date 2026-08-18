<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProviderPublicResource;
use App\Http\Resources\ServiceCardResource;
use App\Http\Resources\ServicePortfolioItemResource;
use App\Services\ServiceMarketplace\ProviderProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ProviderController extends Controller
{
    public function __construct(
        private readonly ProviderProfileService $providers,
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
        $paginator = $this->providers->listServices($provider, $request->query());

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
