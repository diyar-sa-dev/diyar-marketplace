<?php

namespace App\Domains\VisualSearch\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\VisualSearch\Requests\VisualSearchRequest;
use App\Domains\VisualSearch\Services\VisualSearchService;
use App\Http\Controllers\Controller;
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
