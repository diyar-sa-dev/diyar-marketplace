<?php

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;

/**
 * Versioned catalog cache keys — bump after product/catalog mutations.
 */
final class CatalogCacheVersion
{
    private const VERSION_KEY = 'diyar:catalog:cache_version';

    public static function current(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }

    public static function bump(): void
    {
        if (! Cache::has(self::VERSION_KEY)) {
            Cache::forever(self::VERSION_KEY, 2);

            return;
        }

        Cache::increment(self::VERSION_KEY);
    }
}
