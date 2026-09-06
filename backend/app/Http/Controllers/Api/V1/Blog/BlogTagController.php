<?php

namespace App\Http\Controllers\Api\V1\Blog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Blog\BlogArticleListRequest;
use App\Http\Resources\BlogArticleCardResource;
use App\Services\Blog\BlogQueryService;
use App\Support\Api\ApiResponse;
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
