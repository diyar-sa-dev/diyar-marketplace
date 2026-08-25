<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogArticleCardResource;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ServiceCardResource;
use App\Services\Blog\BlogEngagementService;
use App\Services\Catalog\ProductEngagementService;
use App\Services\ServiceMarketplace\ServiceEngagementService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    public function __construct(
        private readonly ProductEngagementService $engagement,
        private readonly ServiceEngagementService $serviceEngagement,
        private readonly BlogEngagementService $blogEngagement,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $products = $this->engagement->countForUser($user);
        $services = $this->serviceEngagement->countForUser($user);
        $articles = $this->blogEngagement->countForUser($user);

        return ApiResponse::success(data: [
            'products' => $products,
            'services' => $services,
            'articles' => $articles,
            'total' => $products + $services + $articles,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $kind = (string) $request->query('kind', 'products');
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 12), 1), 48);

        if ($kind === 'services') {
            $paginator = $this->serviceEngagement->paginateWishlist($request->user(), $page, $perPage);
            $services = $paginator->getCollection()
                ->map(function ($item) {
                    $service = $item->service;
                    if ($service !== null) {
                        $service->setAttribute('user_saved', true);
                    }

                    return $service;
                })
                ->filter();

            return ApiResponse::success(data: [
                'kind' => 'services',
                'items' => ServiceCardResource::collection($services)->resolve(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ]);
        }

        if ($kind === 'articles') {
            $paginator = $this->blogEngagement->paginateWishlist($request->user(), $page, $perPage);
            $articles = $paginator->getCollection()
                ->map(function ($item) {
                    $article = $item->article;
                    if ($article !== null) {
                        $article->setAttribute('user_saved', true);
                    }

                    return $article;
                })
                ->filter();

            return ApiResponse::success(data: [
                'kind' => 'articles',
                'items' => BlogArticleCardResource::collection($articles)->resolve(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ]);
        }

        $paginator = $this->engagement->paginateWishlist(
            $request->user(),
            $page,
            $perPage,
        );

        $products = $paginator->getCollection()
            ->map(function ($item) {
                $product = $item->product;
                if ($product !== null) {
                    $product->setAttribute('user_saved', true);
                }

                return $product;
            })
            ->filter();

        return ApiResponse::success(data: [
            'kind' => 'products',
            'items' => ProductCardResource::collection($products)->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $removed = DB::transaction(function () use ($request) {
            $user = $request->user();
            $removedProducts = $this->engagement->clearWishlist($user);
            $removedServices = $this->serviceEngagement->clearWishlist($user);
            $removedArticles = $this->blogEngagement->clearWishlist($user);

            return $removedProducts + $removedServices + $removedArticles;
        });

        return ApiResponse::success(
            data: ['removed' => $removed],
            message: __('diyar.catalog.wishlist_cleared'),
        );
    }
}
