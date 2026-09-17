<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\CatalogSearchRequest;
use App\Services\Catalog\CachedFilterSuggestionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class FilterSuggestionsController extends Controller
{
    public function __construct(
        private readonly CachedFilterSuggestionService $suggestions,
    ) {}

    public function __invoke(CatalogSearchRequest $request): JsonResponse
    {
        $filters = $request->validatedFilters();
        $locale = $request->getPreferredLanguage(['ar', 'en']) ?? app()->getLocale();
        $results = $this->suggestions->suggestCatalogSearch($filters, $locale);

        $payload = [];

        foreach ($results as $key => $result) {
            $payload[$key] = $result->toArray();
        }

        return ApiResponse::success(data: $payload);
    }
}
