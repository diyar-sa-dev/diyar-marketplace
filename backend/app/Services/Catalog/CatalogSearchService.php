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
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class CatalogSearchService
{
    private const FACET_VENDOR_LIMIT = 20;

    private const FACET_COLOR_LIMIT = 12;

    public function __construct(
        private readonly ProductService $products,
        private readonly ServiceCatalogService $services,
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
        $type = (string) ($filters['type'] ?? 'all');
        $payload = [
            'type' => $type,
            'query' => $filters['q'] ?? null,
            'facets' => $this->facets($filters),
        ];

        if ($type === 'all' || $type === 'products') {
            $payload['products'] = $this->cachedProductResults($filters, $user);
        }

        if ($type === 'all' || $type === 'services') {
            $payload['services'] = $this->cachedServiceResults($filters, $user);
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
        if ($user !== null) {
            $paginator = $this->products->listPublic($this->productFilters($filters), $user);

            return $this->paginatedPayload($paginator, ProductCardResource::class);
        }

        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = 'diyar:catalog:search:products:v1:'.$version.':'.md5(json_encode($this->productFilters($filters)));
        $ttl = (int) config('diyar.catalog.cache.search_results_seconds', 60);

        return StampedeSafeCache::remember($cacheKey, $ttl, function () use ($filters): array {
            $paginator = $this->products->listPublic($this->productFilters($filters));

            return $this->paginatedPayload($paginator, ProductCardResource::class);
        }, 'lock:'.$cacheKey);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{items: mixed, pagination: array<string, int>}
     */
    private function cachedServiceResults(array $filters, ?User $user): array
    {
        if ($user !== null) {
            $paginator = $this->services->listPublic($this->serviceFilters($filters), $user);

            return $this->paginatedPayload($paginator, ServiceCardResource::class);
        }

        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = 'diyar:catalog:search:services:v1:'.$version.':'.md5(json_encode($this->serviceFilters($filters)));
        $ttl = (int) config('diyar.catalog.cache.search_results_seconds', 60);

        return StampedeSafeCache::remember($cacheKey, $ttl, function () use ($filters): array {
            $paginator = $this->services->listPublic($this->serviceFilters($filters));

            return $this->paginatedPayload($paginator, ServiceCardResource::class);
        }, 'lock:'.$cacheKey);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function productFilters(array $filters): array
    {
        $colors = $this->normalizeColorFilters($filters);

        return array_filter([
            'q' => $filters['q'] ?? null,
            'category_slug' => $filters['category_slug'] ?? null,
            'vendor_id' => $filters['vendor_id'] ?? null,
            'vendor_slug' => $filters['vendor_slug'] ?? null,
            'min_price' => $filters['min_price'] ?? null,
            'max_price' => $filters['max_price'] ?? null,
            'colors' => $colors !== [] ? $colors : null,
            'material' => $filters['material'] ?? null,
            'availability_mode' => $filters['availability_mode'] ?? null,
            'discounted' => $filters['discounted'] ?? null,
            'sort' => $this->mapProductSort($filters['sort'] ?? null),
            'page' => $filters['product_page'] ?? $filters['page'] ?? 1,
            'per_page' => $filters['per_page'] ?? 24,
        ], fn ($value) => $value !== null && $value !== '');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<string>
     */
    private function normalizeColorFilters(array $filters): array
    {
        if (! empty($filters['colors'])) {
            $raw = $filters['colors'];
            $values = is_array($raw) ? $raw : explode(',', (string) $raw);

            return array_values(array_filter(array_map(
                static fn (mixed $color): string => trim((string) $color),
                $values,
            )));
        }

        if (! empty($filters['color'])) {
            return [trim((string) $filters['color'])];
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function serviceFilters(array $filters): array
    {
        return array_filter([
            'q' => $filters['q'] ?? null,
            'category' => $filters['category_slug'] ?? null,
            'min_price' => $filters['min_price'] ?? null,
            'max_price' => $filters['max_price'] ?? null,
            'sort' => $this->mapServiceSort($filters['sort'] ?? null),
            'page' => $filters['service_page'] ?? $filters['page'] ?? 1,
            'per_page' => $filters['per_page'] ?? 24,
        ], fn ($value) => $value !== null && $value !== '');
    }

    private function mapProductSort(?string $sort): string
    {
        return match ($sort) {
            'latest', '-created_at', null, '' => '-created_at',
            '-popular' => '-popular',
            '-discount', 'discount' => '-discount',
            'price', '-price', 'name', '-name', 'created_at' => $sort,
            default => '-created_at',
        };
    }

    private function mapServiceSort(?string $sort): string
    {
        return match ($sort) {
            'rating', '-popular' => 'rating',
            'price' => 'price_asc',
            '-price' => 'price_desc',
            'latest', '-created_at', null, '' => 'latest',
            default => 'latest',
        };
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
            ->tap(fn (Builder $q) => $this->products->applyPublicFilters($q, $this->productFilters($facetFilters)));

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
            ->tap(fn (Builder $q) => $this->products->applyPublicFilters($q, $this->productFilters($facetFilters)))
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
