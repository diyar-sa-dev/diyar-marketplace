<?php

namespace App\Services\Catalog;

use App\Http\Resources\ProductDetailResource;
use App\Models\User;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;

final class CachedPublicProductDetailService
{
    public function __construct(
        private readonly ProductService $products,
    ) {}

    /**
     * Guest product-detail payloads are versioned + TTL-cached. Authenticated
     * shows stay uncached so user_liked / user_saved / is_own_store / sales_stats
     * cannot leak across users.
     *
     * @return array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}
     */
    public function show(string $id, ?User $user): array
    {
        if ($user !== null) {
            return $this->load($id, $user);
        }

        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogProductDetail($id, $version, app()->getLocale());
        $ttlSeconds = (int) config('diyar.catalog.cache.product_detail_seconds', 60);

        return StampedeSafeCache::remember(
            $cacheKey,
            $ttlSeconds,
            fn (): array => $this->load($id, null),
            'lock:'.$cacheKey,
        );
    }

    /**
     * @return array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}
     */
    private function load(string $id, ?User $user): array
    {
        $product = $this->products->findPublic($id, $user);
        $related = $this->products->relatedProducts($product, user: $user);

        return [
            'product' => (new ProductDetailResource($product, $related))->resolve(),
            'analytics_product_id' => $product->id,
            'analytics_vendor_account_id' => $product->vendor_account_id,
        ];
    }
}
