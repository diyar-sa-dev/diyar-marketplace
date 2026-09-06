<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\CatalogSearchRequest;
use App\Services\Catalog\CatalogSearchService;
use App\Services\Search\SearchAnalyticsRecorder;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class CatalogSearchController extends Controller
{
    public function __construct(
        private readonly CatalogSearchService $search,
        private readonly SearchAnalyticsRecorder $analytics,
    ) {}

    public function __invoke(CatalogSearchRequest $request): JsonResponse
    {
        $started = hrtime(true);
        $filters = $request->validatedFilters();
        $payload = $this->search->search($filters, $request->user());
        $durationMs = (int) round((hrtime(true) - $started) / 1_000_000);

        $query = trim((string) ($filters['q'] ?? ''));
        if ($query !== '') {
            $this->analytics->record(
                query: $query,
                searchType: (string) ($filters['type'] ?? 'all'),
                resultCount: $this->analytics->countResults($payload),
                userId: $request->user()?->id,
                sessionId: $request->header('X-Search-Session'),
                locale: $request->getPreferredLanguage(),
                filters: $filters,
                durationMs: $durationMs,
            );
        }

        return ApiResponse::success(data: $payload);
    }
}
