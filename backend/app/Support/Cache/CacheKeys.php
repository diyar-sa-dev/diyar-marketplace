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

    public static function catalogFilterContextSummary(string $contextSignature, int $version = 0): string
    {
        return sprintf(
            'diyar:catalog:filter-context:v1:%d:%s',
            $version,
            $contextSignature,
        );
    }

    public static function catalogFilterSuggestions(string $contextSignature, int $version, string $locale): string
    {
        return sprintf(
            'diyar:catalog:filter-suggestions:v1:%d:%s:%s',
            $version,
            $contextSignature,
            $locale,
        );
    }

    public static function catalogFilterSuggestionsStale(string $contextSignature, int $version, string $locale): string
    {
        return sprintf(
            'diyar:catalog:filter-suggestions:stale:v1:%d:%s:%s',
            $version,
            $contextSignature,
            $locale,
        );
    }

    public static function adminPermissions(string $userId, int $version = 0): string
    {
        return sprintf('diyar:admin:permissions:v4:%s:%d', $userId, $version);
    }

    public static function visualSearchResult(string $queryFingerprint): string
    {
        $defaultMinSimilarity = (float) config('diyar.visual_search.min_similarity', 0.90);
        $minSimilarity = max(
            0.1,
            min(
                1.0,
                app(\App\Services\Settings\EffectiveConfigService::class)->decimal(
                    'feature.visual_search_min_similarity',
                    $defaultMinSimilarity,
                ),
            ),
        );

        return sprintf(
            'diyar:visual-search:v1:%s:%s:%s:%s:%s:%s:%s:%s:%s',
            config('diyar.visual_search.engine_version', 'perceptual-v1'),
            config('diyar.visual_search.representation_version', 'dhash-64-v1'),
            config('diyar.visual_search.ranking_version', 'ranking-v1'),
            config('diyar.visual_search.index_version', 'catalog-v1'),
            config('diyar.visual_search.max_hamming_distance', 19),
            $minSimilarity,
            config('diyar.visual_search.candidate_limit', 50),
            self::visualSearchCacheGeneration(),
            $queryFingerprint,
        );
    }

    public static function visualSearchCacheGeneration(): int
    {
        try {
            return (int) \Illuminate\Support\Facades\Cache::get('diyar:visual-search:cache-generation', 0);
        } catch (\Throwable) {
            return 0;
        }
    }

    public static function bumpVisualSearchCacheGeneration(): void
    {
        try {
            \Illuminate\Support\Facades\Cache::increment('diyar:visual-search:cache-generation');
        } catch (\Throwable) {
            // Cache unavailable — searches still work without invalidation.
        }
    }
}
