<?php

namespace App\Domains\Blog\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Blog\Requests\BlogArticleListRequest;
use App\Domains\Blog\Resources\BlogArticleCardResource;
use App\Domains\Blog\Resources\BlogArticleDetailResource;
use App\Domains\Blog\Services\BlogEngagementService;
use App\Domains\Blog\Services\BlogQueryService;
use App\Core\Support\Api\ApiResponse;
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
