<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBlogCategoryRequest;
use App\Http\Requests\Admin\UpdateBlogCategoryRequest;
use App\Http\Resources\BlogCategoryResource;
use App\Models\BlogCategory;
use App\Models\User;
use App\Services\Blog\AdminBlogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminBlogCategoryController extends Controller
{
    public function __construct(
        private readonly AdminBlogService $blog,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', BlogCategory::class);

        $categories = BlogCategory::query()->orderBy('name')->get();

        return ApiResponse::success(data: [
            'categories' => BlogCategoryResource::collection($categories),
        ]);
    }

    public function store(StoreBlogCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', BlogCategory::class);

        $category = $this->blog->createCategory(
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(
            data: ['category' => new BlogCategoryResource($category)],
            status: 201,
        );
    }

    public function show(string $category): JsonResponse
    {
        $model = $this->findCategory($category);
        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'category' => new BlogCategoryResource($model),
        ]);
    }

    public function update(UpdateBlogCategoryRequest $request, string $category): JsonResponse
    {
        $model = $this->findCategory($category);
        $this->authorize('update', $model);

        $updated = $this->blog->updateCategory(
            $model,
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(data: [
            'category' => new BlogCategoryResource($updated),
        ]);
    }

    public function destroy(Request $request, string $category): JsonResponse
    {
        $model = $this->findCategory($category);
        $this->authorize('delete', $model);

        $this->blog->deleteCategory($model, $this->adminActor($request));

        return ApiResponse::success();
    }

    private function findCategory(string $category): BlogCategory
    {
        $model = BlogCategory::query()->find($category);

        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.catalog.category_not_found'));
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
