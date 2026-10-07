<?php

namespace App\Domains\Blog\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Blog\Resources\BlogCategoryResource;
use App\Domains\Blog\Services\BlogQueryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BlogCategoryController extends Controller
{
    public function __construct(
        private readonly BlogQueryService $blog,
    ) {}

    public function index(): JsonResponse
    {
        $categories = $this->blog->listCategories();

        return ApiResponse::success(data: [
            'categories' => BlogCategoryResource::collection($categories),
        ]);
    }
}
