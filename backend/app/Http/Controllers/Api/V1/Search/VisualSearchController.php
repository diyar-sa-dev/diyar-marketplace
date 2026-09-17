<?php

namespace App\Http\Controllers\Api\V1\Search;

use App\Http\Controllers\Controller;
use App\Http\Requests\Search\VisualSearchRequest;
use App\Services\Search\Visual\VisualSearchService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class VisualSearchController extends Controller
{
    public function __construct(
        private readonly VisualSearchService $visualSearch,
    ) {}

    public function __invoke(VisualSearchRequest $request): JsonResponse
    {
        $payload = $this->visualSearch->search(
            image: $request->file('image'),
            page: (int) $request->input('page', 1),
            perPage: (int) $request->input('per_page', 20),
            user: $request->user(),
            sessionKey: $request->header('X-Visual-Search-Session') ?? $request->header('X-Search-Session'),
        );

        return ApiResponse::success(
            data: [
                'items' => $payload['items'],
                'pagination' => $payload['pagination'],
            ],
            meta: $payload['meta'],
        );
    }
}
