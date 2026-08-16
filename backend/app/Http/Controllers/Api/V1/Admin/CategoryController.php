<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\Catalog\CategoryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categories,
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

        $category = $this->categories->create($request->validated());

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

        $updated = $this->categories->update($model, $request->validated());

        return ApiResponse::success(data: [
            'category' => new CategoryResource($updated),
        ]);
    }

    public function destroy(string $category): JsonResponse
    {
        $model = Category::query()->find($category);
        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.catalog.category_not_found'));
        }

        $this->authorize('delete', $model);

        $this->categories->delete($model);

        return ApiResponse::success();
    }
}
