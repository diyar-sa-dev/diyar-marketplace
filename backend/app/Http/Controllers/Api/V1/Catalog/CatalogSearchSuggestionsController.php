<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Services\Catalog\CatalogSearchSuggestionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogSearchSuggestionsController extends Controller
{
    public function __construct(
        private readonly CatalogSearchSuggestionService $suggestions,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        $payload = $this->suggestions->suggest(
            (string) ($validated['q'] ?? ''),
            (int) ($validated['limit'] ?? 8),
        );

        return ApiResponse::success($payload);
    }
}
