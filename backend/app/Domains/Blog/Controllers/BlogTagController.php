<?php

namespace App\Domains\Blog\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Blog\Requests\BlogArticleListRequest;
use App\Domains\Blog\Resources\BlogArticleCardResource;
use App\Domains\Blog\Services\BlogQueryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

class BlogTagController extends Controller
{
    public function __construct(
        private readonly BlogQueryService $blog,
    ) {}

    public function show(BlogArticleListRequest $request, string $slug): JsonResponse
    {
        $paginator = $this->blog->listPublishedByTagSlug($slug, $request->validatedFilters());

        return ApiResponse::success(data: $this->paginatedArticles($paginator));
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedArticles(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => BlogArticleCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
