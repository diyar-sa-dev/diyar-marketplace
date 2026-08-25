<?php

namespace App\Http\Controllers\Api\V1\Blog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Blog\BlogArticleListRequest;
use App\Http\Resources\BlogArticleCardResource;
use App\Http\Resources\BlogArticleDetailResource;
use App\Services\Blog\BlogQueryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

class BlogArticleController extends Controller
{
    public function __construct(
        private readonly BlogQueryService $blog,
    ) {}

    public function index(BlogArticleListRequest $request): JsonResponse
    {
        $paginator = $this->blog->listPublished($request->validatedFilters());

        return ApiResponse::success(data: $this->paginatedArticles($paginator));
    }

    public function show(string $slug): JsonResponse
    {
        $article = $this->blog->findPublishedBySlug($slug);
        $related = $this->blog->relatedPublished($article);

        return ApiResponse::success(data: [
            'article' => new BlogArticleDetailResource($article),
            'related' => BlogArticleCardResource::collection($related)->resolve(),
        ]);
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
