<?php

namespace App\Http\Controllers\Api\V1\Blog;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogCategoryResource;
use App\Services\Blog\BlogQueryService;
use App\Support\Api\ApiResponse;
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
