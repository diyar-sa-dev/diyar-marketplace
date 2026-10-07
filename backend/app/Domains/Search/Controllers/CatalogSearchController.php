<?php

namespace App\Domains\Search\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Search\Requests\CatalogSearchRequest;
use App\Domains\Search\Services\CatalogSearchService;
use App\Domains\Search\Services\SearchAnalyticsRecorder;
use App\Http\Controllers\Controller;
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
            $userId = $request->user()?->id;
            $sessionId = $request->header('X-Search-Session');
            $locale = $request->getPreferredLanguage();
            $resultCount = $this->analytics->countResults($payload);
            $searchType = (string) ($filters['type'] ?? 'all');

            $this->analytics->dispatchSearchQueryEvent(
                query: $query,
                searchType: $searchType,
                resultCount: $resultCount,
                userId: $userId,
                sessionId: $sessionId,
                locale: $locale,
                filters: $filters,
                durationMs: $durationMs,
            );
        }

        return ApiResponse::success(data: $payload);
    }
}
