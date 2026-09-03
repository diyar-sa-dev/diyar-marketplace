<?php

namespace App\Services\Storefront;

use App\Http\Resources\BlogArticleCardResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ServiceCardResource;
use App\Http\Resources\VendorCardResource;
use App\Models\Product;
use App\Models\User;
use App\Services\Blog\BlogQueryService;
use App\Services\Catalog\CategoryService;
use App\Services\Catalog\ProductService;
use App\Services\Catalog\VendorService;
use App\Services\ServiceMarketplace\ServiceCatalogService;
use App\Support\Cache\StampedeSafeCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

final class HomeStorefrontService
{
    public function __construct(
        private readonly CategoryService $categories,
        private readonly ProductService $products,
        private readonly VendorService $vendors,
        private readonly ServiceCatalogService $services,
        private readonly BlogQueryService $blog,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(?User $user = null): array
    {
        $ttl = (int) config('diyar.storefront.home_section_cache_seconds', 120);

        return [
            'product_categories' => $this->rememberSection('product_categories', $ttl, fn () => [
                'categories' => CategoryResource::collection(
                    $this->categories->listActiveTree('product'),
                )->resolve(),
            ]),
            'service_categories' => $this->rememberSection('service_categories', $ttl, fn () => [
                'categories' => CategoryResource::collection(
                    $this->categories->listActiveTree('service'),
                )->resolve(),
            ]),
            'most_interactive_products' => $this->rememberSection(
                'most_interactive_products',
                $ttl,
                fn () => $this->paginatedProducts($this->products->listPublic([
                    'per_page' => 6,
                    'sort' => '-created_at',
                ], null)),
                $user,
            ),
            'featured_deals' => $this->rememberSection(
                'featured_deals',
                $ttl,
                function () {
                    $paginator = $this->products->listPublic([
                        'per_page' => 5,
                        'discounted' => true,
                        'sort' => '-discount',
                    ], null);

                    return [
                        ...$this->paginatedProducts($paginator),
                        'ends_at' => $this->earliestPromotionEndsAt($paginator->getCollection()),
                    ];
                },
                $user,
            ),
            'new_arrivals' => $this->rememberSection(
                'new_arrivals',
                $ttl,
                fn () => $this->paginatedProducts($this->products->listPublic([
                    'per_page' => 6,
                    'sort' => '-created_at',
                ], null)),
                $user,
            ),
            'best_sellers' => $this->rememberSection(
                'best_sellers',
                $ttl,
                fn () => $this->paginatedProducts($this->products->listPublic([
                    'per_page' => 8,
                    'sort' => '-popular',
                ], null)),
                $user,
            ),
            'suggested_for_you' => $this->rememberSection(
                'suggested_for_you',
                $ttl,
                fn () => $this->paginatedProducts($this->products->listPublic([
                    'per_page' => 5,
                    'sort' => '-created_at',
                ], null)),
                $user,
            ),
            'featured_vendors' => $this->rememberSection(
                'featured_vendors',
                $ttl,
                function () {
                    $paginator = $this->vendors->listPublic(['per_page' => 6]);

                    return [
                        'items' => VendorCardResource::collection($paginator->getCollection())->resolve(),
                        'pagination' => $this->paginationMeta($paginator),
                    ];
                },
            ),
            'services_by_category' => $this->rememberSection(
                'services_by_category',
                $ttl,
                fn () => $this->servicesByCategory($user),
            ),
            'blog_articles' => $this->rememberSection(
                'blog_articles',
                $ttl,
                function () {
                    $paginator = $this->blog->listPublished(['per_page' => 3]);

                    return [
                        'items' => BlogArticleCardResource::collection($paginator->getCollection())->resolve(),
                        'pagination' => $this->paginationMeta($paginator),
                    ];
                },
            ),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function servicesByCategory(?User $user): array
    {
        $categories = $this->categories->listActiveTree('service')->take(6);
        $sections = [];

        foreach ($categories as $category) {
            if ($category->slug === null || $category->slug === '') {
                continue;
            }

            $paginator = $this->services->listPublic([
                'category' => $category->slug,
                'per_page' => 3,
                'sort' => 'latest',
            ], $user);

            $sections[] = [
                'category' => (new CategoryResource($category))->resolve(),
                'items' => ServiceCardResource::collection($paginator->getCollection())->resolve(),
            ];
        }

        return $sections;
    }

    /**
     * @param  callable(): mixed  $callback
     */
    private function rememberSection(string $key, int $ttlSeconds, callable $callback, ?User $user = null): mixed
    {
        $scope = $user?->id ?? 'guest';

        return StampedeSafeCache::remember(
            "storefront:home:{$scope}:{$key}",
            $ttlSeconds,
            $callback,
            "lock:storefront:home:{$scope}:{$key}",
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedProducts(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ProductCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => $this->paginationMeta($paginator),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    /**
     * @param  Collection<int, Product>  $products
     */
    private function earliestPromotionEndsAt(Collection $products): ?string
    {
        $now = now();
        $earliest = null;

        foreach ($products as $product) {
            if ($product->promotion_ends_at === null || ! $product->promotion_ends_at->gt($now)) {
                continue;
            }

            if ($earliest === null || $product->promotion_ends_at->lt($earliest)) {
                $earliest = $product->promotion_ends_at;
            }
        }

        return $earliest?->toIso8601String();
    }
}
