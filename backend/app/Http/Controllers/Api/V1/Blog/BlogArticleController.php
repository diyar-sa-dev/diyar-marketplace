<?php

namespace App\Http\Controllers\Api\V1\Blog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Blog\BlogArticleListRequest;
use App\Http\Resources\BlogArticleCardResource;
use App\Http\Resources\BlogArticleDetailResource;
use App\Services\Blog\BlogEngagementService;
use App\Services\Blog\BlogQueryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class BlogArticleController extends Controller
{
    public function __construct(
        private readonly BlogQueryService $blog,
        private readonly BlogEngagementService $engagement,
    ) {}

    public function index(BlogArticleListRequest $request): JsonResponse
    {
        $paginator = $this->blog->listPublished($request->validatedFilters());

        return ApiResponse::success(data: $this->paginatedArticles($paginator));
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $article = $this->blog->findPublishedBySlug($slug);

        if ($request->user() !== null) {
            $article->setAttribute(
                'user_saved',
                $this->engagement->userSaved($request->user(), $article),
            );
        }

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
