<?php

namespace App\Services\Catalog;

use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\Context\FilterContextSignature;
use App\Support\Catalog\Filters\Context\FilterContextSummary;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;

class CachedFilterContextSummaryService
{
    public function __construct(
        private readonly FilterContextSummaryService $summaries,
        private readonly CatalogFilterNormalizer $normalizer,
    ) {}

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    public function summarize(FilterContext $context, array $engineFilters): FilterContextSummary
    {
        $signature = FilterContextSignature::make($context);
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogFilterContextSummary($signature, $version);
        $ttlSeconds = (int) config('diyar.catalog.cache.filter_context_seconds', 300);

        /** @var FilterContextSummary $summary */
        $summary = StampedeSafeCache::remember(
            $cacheKey,
            $ttlSeconds,
            fn (): FilterContextSummary => $this->summaries->summarize($context, $engineFilters),
            'lock:'.$cacheKey,
        );

        return $summary;
    }

    /**
     * @param  array<string, mixed>  $normalizedCatalogFilters
     * @return array{products?: FilterContextSummary, services?: FilterContextSummary}
     */
    public function summarizeCatalogSearch(array $normalizedCatalogFilters, ?string $locale = null): array
    {
        $type = (string) ($normalizedCatalogFilters['type'] ?? 'all');
        $summaries = [];

        if ($type === 'all' || $type === 'products') {
            $engineFilters = $this->normalizer->productEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Product,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $summaries['products'] = $this->summarize($context, $engineFilters);
        }

        if ($type === 'all' || $type === 'services') {
            $engineFilters = $this->normalizer->serviceEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Service,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $summaries['services'] = $this->summarize($context, $engineFilters);
        }

        return $summaries;
    }
}
