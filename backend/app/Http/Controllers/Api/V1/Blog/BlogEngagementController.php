<?php

namespace App\Http\Controllers\Api\V1\Blog;

use App\Http\Controllers\Controller;
use App\Services\Blog\BlogEngagementService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogEngagementController extends Controller
{
    public function __construct(
        private readonly BlogEngagementService $engagement,
    ) {}

    public function toggleWishlist(Request $request, string $slug): JsonResponse
    {
        $article = $this->engagement->findPublicArticle($slug);
        $result = $this->engagement->toggleWishlist($request->user(), $article);

        return ApiResponse::success(data: $result);
    }
}
