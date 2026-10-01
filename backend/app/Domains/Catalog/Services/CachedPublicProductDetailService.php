<?php

namespace App\Domains\Catalog\Services;

use App\Domains\Catalog\Resources\ProductDetailResource;
use App\Models\User;
use App\Core\Support\Cache\CacheKeys;
use App\Core\Support\Cache\StampedeSafeCache;
use App\Core\Support\Cache\VersionedCache;

final class CachedPublicProductDetailService
{
    public function __construct(
        private readonly ProductService $products,
        private readonly ProductDetailUserOverlayService $overlay,
    ) {}

    /**
     * Guest payloads are versioned + TTL-cached. Authenticated viewers reuse the
     * guest-safe public body and merge a minimal per-user overlay (never cached globally).
     *
     * @return array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}
     */
    public function show(string $id, ?User $user): array
    {
        $payload = $this->publicBody($id);

        if ($user === null) {
            return $payload;
        }

        return $this->overlay->apply($payload, $user);
    }

    /**
     * @return array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}
     */
    private function publicBody(string $id): array
    {
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogProductDetail($id, $version, app()->getLocale());
        $ttlSeconds = (int) config('diyar.catalog.cache.product_detail_seconds', 60);

        return StampedeSafeCache::remember(
            $cacheKey,
            $ttlSeconds,
            fn (): array => $this->loadPublic($id),
            'lock:'.$cacheKey,
        );
    }

    /**
     * @return array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}
     */
    private function loadPublic(string $id): array
    {
        $product = $this->products->findPublic($id);
        $related = $this->products->relatedProducts($product);

        return [
            'product' => (new ProductDetailResource($product, $related))->resolve(),
            'analytics_product_id' => $product->id,
            'analytics_vendor_account_id' => $product->vendor_account_id,
        ];
    }
}
