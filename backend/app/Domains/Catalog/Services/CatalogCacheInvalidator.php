<?php

namespace App\Domains\Catalog\Services;

use App\Core\Support\Cache\CacheKeys;
use App\Core\Support\Cache\VersionedCache;

final class CatalogCacheInvalidator
{
    public function invalidateSearchCaches(): void
    {
        VersionedCache::bump(CacheKeys::CATALOG_VERSION);
    }

    public function invalidateSearchCachesAfterCommit(): void
    {
        VersionedCache::bumpAfterCommit(CacheKeys::CATALOG_VERSION);
    }
}
