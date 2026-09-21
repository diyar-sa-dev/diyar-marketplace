<?php

namespace App\Services\Catalog;

use App\Http\Resources\ProductCardResource;
use App\Models\User;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class CachedPublicProductListService
{
    public function __construct(
        private readonly ProductService $products,
    ) {}

    /**
     * Guest listings are versioned + TTL-cached. Authenticated listings stay uncached
     * so user_saved / is_own_store cannot leak across users.
     *
     * @param  array<string, mixed>  $filters
     * @return array{items: mixed, pagination: array<string, int>}
     */
    public function paginated(array $filters, ?User $user): array
    {
        if ($user !== null) {
            return $this->serialize($this->products->listPublic($filters, $user));
        }

        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogProductList($filters, $version, app()->getLocale());
        $ttlSeconds = (int) config('diyar.catalog.cache.product_list_seconds', 60);

        return StampedeSafeCache::remember(
            $cacheKey,
            $ttlSeconds,
            fn (): array => $this->serialize($this->products->listPublic($filters)),
            'lock:'.$cacheKey,
        );
    }

    /**
     * @return array{items: mixed, pagination: array<string, int>}
     */
    private function serialize(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ProductCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
