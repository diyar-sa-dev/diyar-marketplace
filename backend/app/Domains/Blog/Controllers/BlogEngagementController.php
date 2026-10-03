<?php

namespace App\Domains\Blog\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Blog\Services\BlogEngagementService;
use App\Core\Support\Api\ApiResponse;
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
