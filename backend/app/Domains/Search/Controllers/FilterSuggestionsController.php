<?php

namespace App\Domains\Search\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Search\Requests\CatalogSearchRequest;
use App\Domains\Catalog\Services\CachedFilterSuggestionService;
use App\Core\Support\Api\ApiResponse;
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
