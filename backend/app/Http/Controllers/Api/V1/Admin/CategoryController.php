<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\User;
use App\Services\Admin\AdminCategoryService;
use App\Services\Catalog\CategoryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categories,
        private readonly AdminCategoryService $adminCategories,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $items = $this->categories->listAll();

        return ApiResponse::success(data: [
            'categories' => CategoryResource::collection($items),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $category = $this->adminCategories->create(
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(
            data: ['category' => new CategoryResource($category)],
            status: 201,
        );
    }

    public function show(string $category): JsonResponse
    {
        $model = Category::query()->with(['parent', 'children'])->find($category);
        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.catalog.category_not_found'));
        }

        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'category' => new CategoryResource($model),
        ]);
    }

    public function update(UpdateCategoryRequest $request, string $category): JsonResponse
    {
        $model = Category::query()->find($category);
        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.catalog.category_not_found'));
        }

        $this->authorize('update', $model);

        $updated = $this->adminCategories->update(
            $model,
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(data: [
            'category' => new CategoryResource($updated),
        ]);
    }

    public function destroy(Request $request, string $category): JsonResponse
    {
        $model = Category::query()->find($category);
        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.catalog.category_not_found'));
        }

        $this->authorize('delete', $model);

        $this->adminCategories->delete($model, $this->adminActor($request));

        return ApiResponse::success();
    }

    private function adminActor(Request $request): User
    {
        /** @var User $admin */
        $admin = $request->user('admin');

        return $admin;
    }
}
