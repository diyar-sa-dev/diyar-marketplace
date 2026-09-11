<?php

namespace App\Services\Catalog;

use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\Context\FilterContextSignature;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionFallbackReason;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionResolutionPath;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionResult;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

final class CachedFilterSuggestionService
{
    public function __construct(
        private readonly FilterSuggestionService $suggestions,
        private readonly CatalogFilterNormalizer $normalizer,
        private readonly FilterSuggestionTelemetry $telemetry,
    ) {}

    /**
     * @param  array<string, mixed>  $normalizedCatalogFilters
     * @return array{products?: FilterSuggestionResult, services?: FilterSuggestionResult}
     */
    public function suggestCatalogSearch(array $normalizedCatalogFilters, ?string $locale = null): array
    {
        if (! (bool) config('diyar.catalog.filter_suggestions.enabled', true)) {
            return $this->disabledResults($normalizedCatalogFilters, $locale);
        }

        $type = (string) ($normalizedCatalogFilters['type'] ?? 'all');
        $results = [];

        if ($type === 'all' || $type === 'products') {
            $engineFilters = $this->normalizer->productEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Product,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $results['products'] = $this->remember($context, $engineFilters, $locale);
        }

        if ($type === 'all' || $type === 'services') {
            $engineFilters = $this->normalizer->serviceEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Service,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $results['services'] = $this->remember($context, $engineFilters, $locale);
        }

        return $results;
    }

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    private function remember(
        FilterContext $context,
        array $engineFilters,
        ?string $locale,
    ): FilterSuggestionResult {
        $signature = FilterContextSignature::make($context);
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $localeKey = $locale !== null && $locale !== '' ? $locale : 'default';
        $cacheKey = CacheKeys::catalogFilterSuggestions($signature, $version, $localeKey);
        $staleKey = CacheKeys::catalogFilterSuggestionsStale($signature, $version, $localeKey);
        $ttlSeconds = (int) config('diyar.catalog.cache.filter_suggestions_seconds', 120);
        $staleTtlSeconds = (int) config('diyar.catalog.cache.filter_suggestions_stale_seconds', 86_400);

        $started = hrtime(true);
        $cacheHit = $this->safeCacheHas($cacheKey);

        try {
            if ($cacheHit) {
                $cached = $this->safeCacheGet($cacheKey);
                if ($this->isValidCachedResult($cached)) {
                    $result = $this->tag($cached, FilterSuggestionResolutionPath::FreshCache);
                } else {
                    $cacheHit = false;
                    $this->safeCacheForget($cacheKey);
                    $result = $this->generateFresh($context, $engineFilters, $locale, $staleKey, $staleTtlSeconds, $cacheKey, $ttlSeconds);
                }
            } else {
                $result = $this->generateFresh($context, $engineFilters, $locale, $staleKey, $staleTtlSeconds, $cacheKey, $ttlSeconds);
            }
        } catch (Throwable $exception) {
            Log::warning('filter_suggestion.cache_failure', [
                'content_type' => $context->contentType->value,
                'message' => $exception->getMessage(),
            ]);

            $result = $this->recover($context, $locale, $staleKey);
            $cacheHit = false;
        }

        $this->telemetry->record([
            'cache_hit' => $cacheHit,
            'content_type' => $context->contentType->value,
            'display_mode' => $result->displayMode,
            'resolution_path' => $result->resolutionPath,
            'suggestion_count' => count($result->suggestions),
            'initialized_filter_count' => count($result->initializedFilters),
            'result_count' => $result->resultCount,
            'duration_ms' => (int) round((hrtime(true) - $started) / 1_000_000),
            'degraded' => $result->degraded,
            'fallback_reason' => $result->fallbackReason,
            'request_id' => $this->requestId(),
        ]);

        return $result;
    }

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    private function generateFresh(
        FilterContext $context,
        array $engineFilters,
        ?string $locale,
        string $staleKey,
        int $staleTtlSeconds,
        string $cacheKey,
        int $ttlSeconds,
    ): FilterSuggestionResult {
        try {
            /** @var array<string, mixed>|FilterSuggestionResult|null $cachedPayload */
            $cachedPayload = StampedeSafeCache::remember(
                $cacheKey,
                $ttlSeconds,
                function () use ($context, $engineFilters, $locale, $staleKey, $staleTtlSeconds): array {
                    $fresh = $this->suggestions->suggest($context, $engineFilters, $locale);
                    $tagged = $this->tag($fresh, FilterSuggestionResolutionPath::FreshGenerate);
                    $this->safeCachePut($staleKey, $tagged, $staleTtlSeconds);

                    return $this->encodeForCache($tagged);
                },
                'lock:'.$cacheKey,
            );

            $result = $this->hydrateCachedResult($cachedPayload);
            if ($result === null) {
                return $this->recover($context, $locale, $staleKey);
            }

            if ($result->resolutionPath === null) {
                return $this->tag($result, FilterSuggestionResolutionPath::FreshGenerate);
            }

            return $result;
        } catch (Throwable $exception) {
            Log::warning('filter_suggestion.generation_failure', [
                'content_type' => $context->contentType->value,
                'message' => $exception->getMessage(),
            ]);

            return $this->recover($context, $locale, $staleKey);
        }
    }

    private function recover(
        FilterContext $context,
        ?string $locale,
        string $staleKey,
    ): FilterSuggestionResult {
        $stale = $this->safeCacheGet($staleKey);
        if ($this->isValidCachedResult($stale)) {
            return $this->tagDegraded(
                $stale,
                FilterSuggestionResolutionPath::StaleCache,
                FilterSuggestionFallbackReason::StaleCache,
            );
        }

        if ($stale !== null) {
            $this->safeCacheForget($staleKey);
        }

        return $this->suggestions->suggestRegistryOnly($context, $locale);
    }

    /**
     * @param  array<string, mixed>  $normalizedCatalogFilters
     * @return array{products?: FilterSuggestionResult, services?: FilterSuggestionResult}
     */
    private function disabledResults(array $normalizedCatalogFilters, ?string $locale): array
    {
        $type = (string) ($normalizedCatalogFilters['type'] ?? 'all');
        $results = [];

        if ($type === 'all' || $type === 'products') {
            $engineFilters = $this->normalizer->productEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Product,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $results['products'] = $this->disabledResult($context);
        }

        if ($type === 'all' || $type === 'services') {
            $engineFilters = $this->normalizer->serviceEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Service,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $results['services'] = $this->disabledResult($context);
        }

        return $results;
    }

    private function disabledResult(FilterContext $context): FilterSuggestionResult
    {
        return new FilterSuggestionResult(
            contentType: $context->contentType->value,
            resultCount: 0,
            resultDensity: 'unknown',
            suggestions: [],
            initializedFilters: [],
            displayMode: 'unavailable',
            degraded: true,
            fallbackReason: FilterSuggestionFallbackReason::Disabled->value,
            resolutionPath: FilterSuggestionResolutionPath::Disabled->value,
        );
    }

    private function tag(FilterSuggestionResult $result, FilterSuggestionResolutionPath $path): FilterSuggestionResult
    {
        return new FilterSuggestionResult(
            contentType: $result->contentType,
            resultCount: $result->resultCount,
            resultDensity: $result->resultDensity,
            suggestions: $result->suggestions,
            initializedFilters: $result->initializedFilters,
            displayMode: $result->displayMode,
            degraded: false,
            fallbackReason: null,
            resolutionPath: $path->value,
        );
    }

    private function tagDegraded(
        FilterSuggestionResult $result,
        FilterSuggestionResolutionPath $path,
        FilterSuggestionFallbackReason $reason,
    ): FilterSuggestionResult {
        return new FilterSuggestionResult(
            contentType: $result->contentType,
            resultCount: $result->resultCount,
            resultDensity: $result->resultDensity,
            suggestions: $result->suggestions,
            initializedFilters: $result->initializedFilters,
            displayMode: $result->displayMode,
            degraded: true,
            fallbackReason: $reason->value,
            resolutionPath: $path->value,
        );
    }

    private function safeCacheHas(string $key): bool
    {
        try {
            return Cache::has($key);
        } catch (Throwable) {
            return false;
        }
    }

    private function safeCacheGet(string $key): mixed
    {
        try {
            $value = Cache::get($key);

            return $this->hydrateCachedResult($value) ?? $value;
        } catch (Throwable) {
            return null;
        }
    }

    private function safeCachePut(string $key, mixed $value, int $ttlSeconds): void
    {
        try {
            if ($value instanceof FilterSuggestionResult) {
                $value = $this->encodeForCache($value);
            }

            Cache::put($key, $value, $ttlSeconds);
        } catch (Throwable) {
            // Stale backup is best-effort.
        }
    }

    private function safeCacheForget(string $key): void
    {
        try {
            Cache::forget($key);
        } catch (Throwable) {
            // Best-effort invalidation.
        }
    }

    private function isValidCachedResult(mixed $value): bool
    {
        $result = $value instanceof FilterSuggestionResult
            ? $value
            : $this->hydrateCachedResult($value);

        if (! $result instanceof FilterSuggestionResult) {
            return false;
        }

        return in_array($result->displayMode, ['ranked', 'initialized', 'unavailable'], true)
            && is_string($result->contentType)
            && is_int($result->resultCount);
    }

    /**
     * @return array<string, mixed>
     */
    private function encodeForCache(FilterSuggestionResult $result): array
    {
        return $result->toArray();
    }

    private function hydrateCachedResult(mixed $value): ?FilterSuggestionResult
    {
        if ($value instanceof FilterSuggestionResult) {
            return $value;
        }

        if (! is_array($value) || ! isset($value['content_type'], $value['display_mode'])) {
            return null;
        }

        try {
            return FilterSuggestionResult::fromArray($value);
        } catch (Throwable) {
            return null;
        }
    }

    private function requestId(): ?string
    {
        if (! app()->bound('request')) {
            return null;
        }

        $request = request();

        return $request->headers->get('X-Request-Id')
            ?? $request->headers->get('X-Correlation-Id')
            ?? (is_string($request->attributes->get('request_id')) ? $request->attributes->get('request_id') : null);
    }
}
