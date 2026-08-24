<?php

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Removes Octane-unsafe Redis entries (serialized Eloquent models / incomplete classes).
 */
final class LegacyRedisCachePurger
{
    /**
     * Keys that previously stored Eloquent collections under Octane.
     *
     * @var list<string>
     */
    private const CATEGORY_TREE_KEYS = [
        'diyar:catalog:categories:tree:all',
        'diyar:catalog:categories:tree:product',
        'diyar:catalog:categories:tree:service',
    ];

    /**
     * @return list<string>
     */
    public static function categoryTreeKeys(): array
    {
        return self::CATEGORY_TREE_KEYS;
    }

    /**
     * @return array{purged: list<string>, corrupt: list<string>}
     */
    public static function purgeCategoryTrees(): array
    {
        $purged = [];
        $corrupt = [];

        foreach (self::CATEGORY_TREE_KEYS as $key) {
            $value = Cache::get($key);

            if ($value === null) {
                continue;
            }

            if (self::isCorruptPayload($value)) {
                $corrupt[] = $key;
            }

            Cache::forget($key);
            $purged[] = $key;
        }

        return compact('purged', 'corrupt');
    }

    /**
     * Redis under Octane must only store arrays, strings, ints, floats, bool, null.
     */
    public static function isCorruptPayload(mixed $value): bool
    {
        if ($value instanceof \__PHP_Incomplete_Class) {
            return true;
        }

        if (is_object($value)) {
            return true;
        }

        if (is_array($value) && ! self::isEloquentTreePayload($value)) {
            return true;
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private static function isEloquentTreePayload(array $payload): bool
    {
        $meta = $payload[EloquentTreeCache::payloadMetaKey()] ?? null;

        return is_array($meta)
            && is_array($meta['items'] ?? null)
            && is_string($meta['model'] ?? null);
    }

    /**
     * @return array{purged: list<string>, corrupt: list<string>}
     */
    public static function purgeAllKnownLegacy(): array
    {
        $result = self::purgeCategoryTrees();

        if ($result['corrupt'] !== []) {
            Log::warning('diyar.cache.legacy_corrupt_purged', [
                'keys' => $result['corrupt'],
            ]);
        }

        return $result;
    }
}
