<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBlogArticleRequest;
use App\Http\Requests\Admin\UpdateBlogArticleRequest;
use App\Http\Resources\BlogArticleCardResource;
use App\Http\Resources\BlogArticleDetailResource;
use App\Models\BlogArticle;
use App\Models\User;
use App\Services\Blog\AdminBlogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminBlogArticleController extends Controller
{
    public function __construct(
        private readonly AdminBlogService $blog,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BlogArticle::class);

        $query = BlogArticle::query()->with(['category', 'tags']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('updated_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('articles', BlogArticleCardResource::collection($paginator->items()), $paginator);
    }

    public function store(StoreBlogArticleRequest $request): JsonResponse
    {
        $this->authorize('create', BlogArticle::class);

        $article = $this->blog->createArticle(
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(
            data: ['article' => new BlogArticleDetailResource($article)],
            status: 201,
        );
    }

    public function show(string $article): JsonResponse
    {
        $model = $this->findArticle($article);
        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'article' => new BlogArticleDetailResource($model),
        ]);
    }

    public function update(UpdateBlogArticleRequest $request, string $article): JsonResponse
    {
        $model = $this->findArticle($article);
        $this->authorize('update', $model);

        $updated = $this->blog->updateArticle(
            $model,
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(data: [
            'article' => new BlogArticleDetailResource($updated),
        ]);
    }

    public function destroy(Request $request, string $article): JsonResponse
    {
        $model = $this->findArticle($article);
        $this->authorize('delete', $model);

        $this->blog->deleteArticle($model, $this->adminActor($request));

        return ApiResponse::success();
    }

    public function publish(Request $request, string $article): JsonResponse
    {
        $model = $this->findArticle($article);
        $this->authorize('publish', $model);

        $updated = $this->blog->publishArticle($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'article' => new BlogArticleDetailResource($updated),
        ]);
    }

    public function unpublish(Request $request, string $article): JsonResponse
    {
        $model = $this->findArticle($article);
        $this->authorize('unpublish', $model);

        $updated = $this->blog->unpublishArticle($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'article' => new BlogArticleDetailResource($updated),
        ]);
    }

    public function archive(Request $request, string $article): JsonResponse
    {
        $model = $this->findArticle($article);
        $this->authorize('archive', $model);

        $updated = $this->blog->archiveArticle($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'article' => new BlogArticleDetailResource($updated),
        ]);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    private function findArticle(string $article): BlogArticle
    {
        $model = BlogArticle::query()->with(['category', 'tags'])->find($article);

        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.blog.article_not_found'));
        }

        return $model;
    }

    private function adminActor(Request $request): User
    {
        /** @var User $admin */
        $admin = $request->user('admin');

        return $admin;
    }
}
