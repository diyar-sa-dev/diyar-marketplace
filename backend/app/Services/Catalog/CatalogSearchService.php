<?php

namespace App\Services\Catalog;

use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ServiceCardResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductColor;
use App\Models\User;
use App\Models\VendorAccount;
use App\Services\ServiceMarketplace\ServiceCatalogService;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class CatalogSearchService
{
    private const FACET_VENDOR_LIMIT = 20;

    private const FACET_COLOR_LIMIT = 12;

    public function __construct(
        private readonly ProductService $products,
        private readonly ServiceCatalogService $services,
        private readonly CatalogFilterNormalizer $filterNormalizer,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array{
     *   type: string,
     *   query: string|null,
     *   products?: array{items: mixed, pagination: array<string, int>},
     *   services?: array{items: mixed, pagination: array<string, int>},
     *   facets: array{vendors: list<array<string, mixed>>, categories: list<array<string, mixed>>, colors: list<array<string, mixed>>}
     * }
     */
    public function search(array $filters, ?User $user = null): array
    {
        $normalizedFilters = $this->filterNormalizer->normalizeForCatalogSearch($filters);

        $type = (string) ($normalizedFilters['type'] ?? 'all');
        $payload = [
            'type' => $type,
            'query' => $normalizedFilters['q'] ?? null,
            'facets' => $this->facets($normalizedFilters),
        ];

        if ($type === 'all' || $type === 'products') {
            $payload['products'] = $this->cachedProductResults($normalizedFilters, $user);
        }

        if ($type === 'all' || $type === 'services') {
            $payload['services'] = $this->cachedServiceResults($normalizedFilters, $user);
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{vendors: list<array<string, mixed>>, categories: list<array<string, mixed>>, colors: list<array<string, mixed>>}
     */
    public function facets(array $filters): array
    {
        $facetFilters = $this->facetCacheKey($filters);
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogSearchFacets($facetFilters, $version);
        $ttlSeconds = (int) config('diyar.catalog.cache.search_facets_seconds', 300);

        return StampedeSafeCache::remember(
            $cacheKey,
            $ttlSeconds,
            function () use ($filters): array {
                [$vendors, $colors] = $this->productFacets($filters);

                return [
                    'vendors' => $vendors,
                    'categories' => $this->categoryFacets($filters),
                    'colors' => $colors,
                ];
            },
            'lock:'.$cacheKey,
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{items: mixed, pagination: array<string, int>}
     */
    private function cachedProductResults(array $filters, ?User $user): array
    {
        $engineFilters = $this->filterNormalizer->productEngineFilters($filters);

        if ($user !== null) {
            $paginator = $this->products->listPublic($engineFilters, $user);

            return $this->paginatedPayload($paginator, ProductCardResource::class);
        }

        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = 'diyar:catalog:search:products:v1:'.$version.':'.md5(json_encode($engineFilters));
        $ttl = (int) config('diyar.catalog.cache.search_results_seconds', 60);

        return StampedeSafeCache::remember($cacheKey, $ttl, function () use ($engineFilters): array {
            $paginator = $this->products->listPublic($engineFilters);

            return $this->paginatedPayload($paginator, ProductCardResource::class);
        }, 'lock:'.$cacheKey);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{items: mixed, pagination: array<string, int>}
     */
    private function cachedServiceResults(array $filters, ?User $user): array
    {
        $engineFilters = $this->filterNormalizer->serviceEngineFilters($filters);

        if ($user !== null) {
            $paginator = $this->services->listPublic($engineFilters, $user);

            return $this->paginatedPayload($paginator, ServiceCardResource::class);
        }

        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = 'diyar:catalog:search:services:v1:'.$version.':'.md5(json_encode($engineFilters));
        $ttl = (int) config('diyar.catalog.cache.search_results_seconds', 60);

        return StampedeSafeCache::remember($cacheKey, $ttl, function () use ($engineFilters): array {
            $paginator = $this->services->listPublic($engineFilters);

            return $this->paginatedPayload($paginator, ServiceCardResource::class);
        }, 'lock:'.$cacheKey);
    }

    /**
     * @param  class-string  $resourceClass
     * @return array{items: mixed, pagination: array<string, int>}
     */
    private function paginatedPayload(LengthAwarePaginator $paginator, string $resourceClass): array
    {
        return [
            'items' => $resourceClass::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: list<array{id: string, store_name: string, slug: string, product_count: int}>, 1: list<array{name: string, hex_code: string|null}>}
     */
    private function productFacets(array $filters): array
    {
        $facetFilters = $this->filtersForFacets($filters);

        $baseQuery = Product::query()
            ->publiclyVisible()
            ->tap(fn (Builder $q) => $this->products->applyPublicFilters($q, $this->filterNormalizer->productEngineFilters($facetFilters)));

        // 1. Vendor facet aggregation
        $rows = (clone $baseQuery)
            ->reorder()
            ->select('products.vendor_account_id')
            ->selectRaw('COUNT(*) as product_count')
            ->groupBy('products.vendor_account_id')
            ->orderByDesc('product_count')
            ->limit(self::FACET_VENDOR_LIMIT)
            ->get();

        $vendors = VendorAccount::query()
            ->active()
            ->whereIn('id', $rows->pluck('vendor_account_id'))
            ->get(['id', 'business_name', 'slug'])
            ->keyBy('id');

        $vendorList = $rows
            ->map(function ($row) use ($vendors) {
                $vendor = $vendors->get($row->vendor_account_id);
                if ($vendor === null) {
                    return null;
                }

                return [
                    'id' => $vendor->id,
                    'store_name' => $vendor->business_name,
                    'slug' => $vendor->slug,
                    'product_count' => (int) $row->product_count,
                ];
            })
            ->filter()
            ->values()
            ->all();

        // 2. Color facet aggregation
        $productIds = (clone $baseQuery)->reorder()->limit(500)->pluck('products.id');

        $colors = [];
        if ($productIds->isNotEmpty()) {
            $colors = ProductColor::query()
                ->whereIn('product_id', $productIds)
                ->select(['name', 'hex_code'])
                ->distinct()
                ->orderBy('name')
                ->limit(self::FACET_COLOR_LIMIT)
                ->get()
                ->map(fn (ProductColor $color): array => [
                    'name' => $color->name,
                    'hex_code' => $color->hex_code,
                ])
                ->all();
        }

        return [$vendorList, $colors];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array{slug: string, name: string, type: string}>
     */
    private function categoryFacets(array $filters): array
    {
        $facetFilters = $this->filtersForFacets($filters);
        unset($facetFilters['category_slug']);

        $matchingCategoryIds = Product::query()
            ->publiclyVisible()
            ->tap(fn (Builder $q) => $this->products->applyPublicFilters($q, $this->filterNormalizer->productEngineFilters($facetFilters)))
            ->reorder()
            ->select('products.category_id')
            ->distinct()
            ->pluck('products.category_id');

        return Category::query()
            ->active()
            ->whereIn('id', $matchingCategoryIds)
            ->whereIn('type', ['product', 'both', 'service'])
            ->orderBy('sort_order')
            ->get(['slug', 'name', 'type'])
            ->map(fn (Category $category): array => [
                'slug' => $category->slug,
                'name' => $category->name,
                'type' => $category->type->value ?? (string) $category->type,
            ])
            ->all();
    }

    /**
     * Facet queries aggregate products; strip sort/pagination/vendor scoping that breaks GROUP BY.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function filtersForFacets(array $filters): array
    {
        $facetFilters = $filters;
        unset(
            $facetFilters['page'],
            $facetFilters['product_page'],
            $facetFilters['service_page'],
            $facetFilters['per_page'],
            $facetFilters['vendor_id'],
            $facetFilters['vendor_slug'],
            $facetFilters['sort'],
            $facetFilters['color'],
            $facetFilters['colors'],
        );

        return $facetFilters;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function facetCacheKey(array $filters): array
    {
        return $this->filtersForFacets($filters);
    }
}
