<?php

namespace App\Support\Cache;

/**
 * Deterministic cache key builders for cross-service consistency.
 *
 * Laravel applies CACHE_PREFIX from the environment; keys here use the diyar namespace.
 */
final class CacheKeys
{
    public const ADMIN_PERMISSIONS_VERSION = 'diyar:admin:permissions:version';

    public const CATALOG_VERSION = 'diyar:catalog:version';

    /**
     * @param  array<string, mixed>  $filters
     */
    public static function catalogSearchFacets(array $filters, int $version = 0): string
    {
        ksort($filters);

        return sprintf(
            'diyar:catalog:search:facets:v1:%d:%s',
            $version,
            md5(json_encode($filters, JSON_THROW_ON_ERROR)),
        );
    }

    public static function catalogSearchSuggestions(string $normalizedQuery, int $limit, int $version = 0): string
    {
        return sprintf(
            'diyar:catalog:search:suggestions:v1:%d:%s:%d',
            $version,
            md5(mb_strtolower($normalizedQuery)),
            $limit,
        );
    }

    public static function adminPermissions(string $userId, int $version = 0): string
    {
        return sprintf('diyar:admin:permissions:v4:%s:%d', $userId, $version);
    }
}
