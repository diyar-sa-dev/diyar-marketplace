<?php

namespace App\Services\Catalog;

use App\Support\Cache\CacheKeys;
use App\Support\Cache\VersionedCache;

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
