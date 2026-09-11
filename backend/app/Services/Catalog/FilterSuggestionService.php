<?php

namespace App\Services\Catalog;

use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\Context\FilterContextMeta;
use App\Support\Catalog\Filters\Context\FilterContextSummary;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestion;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionApplyResolver;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionFallbackReason;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionResolutionPath;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionResult;

final class FilterSuggestionService
{
    public function __construct(
        private readonly CachedFilterContextSummaryService $summaries,
        private readonly FilterSuggestionRankingService $ranker,
        private readonly FilterSuggestionInitializationService $initializer,
        private readonly CatalogFilterNormalizer $normalizer,
        private readonly FilterSuggestionApplyResolver $applyResolver,
    ) {}

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    public function suggest(FilterContext $context, array $engineFilters, ?string $locale = null): FilterSuggestionResult
    {
        $summary = $this->summaries->summarize($context, $engineFilters);
        $ranked = $this->localize($this->ranker->rank($context, $summary), $locale, 'ranked');

        $excludeGroups = array_map(
            static fn (FilterSuggestion $suggestion): string => $suggestion->group->value,
            $ranked,
        );

        $initialized = $this->localize(
            $this->initializer->initialize($context, $summary, $excludeGroups),
            $locale,
            'initialized',
        );

        $displayMode = match (true) {
            $ranked !== [] => 'ranked',
            $initialized !== [] => 'initialized',
            default => 'unavailable',
        };

        return new FilterSuggestionResult(
            contentType: $context->contentType->value,
            resultCount: $summary->context->resultCount,
            resultDensity: $summary->context->resultDensity,
            suggestions: $ranked,
            initializedFilters: $ranked === [] ? $initialized : [],
            displayMode: $displayMode,
        );
    }

    /**
     * Registry-only fallback — zero database queries.
     */
    public function suggestRegistryOnly(FilterContext $context, ?string $locale = null): FilterSuggestionResult
    {
        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: $context->contentType,
                surface: $context->surface,
                resultCount: 0,
                resultDensity: 'unknown',
                confidence: 'none',
                categorySlug: $context->categorySlug,
                searchQuery: $context->searchQuery,
                locale: $context->locale,
                sort: $context->sort,
            ),
            price: null,
            filterStatistics: [],
        );

        $initialized = $this->localize(
            $this->initializer->initialize($context, $summary),
            $locale,
            'initialized',
        );

        return new FilterSuggestionResult(
            contentType: $context->contentType->value,
            resultCount: 0,
            resultDensity: 'unknown',
            suggestions: [],
            initializedFilters: $initialized,
            displayMode: $initialized !== [] ? 'initialized' : 'unavailable',
            degraded: true,
            fallbackReason: FilterSuggestionFallbackReason::RegistryOnly->value,
            resolutionPath: FilterSuggestionResolutionPath::RegistryOnly->value,
        );
    }

    public static function unavailable(FilterContext $context): FilterSuggestionResult
    {
        return new FilterSuggestionResult(
            contentType: $context->contentType->value,
            resultCount: 0,
            resultDensity: 'unknown',
            suggestions: [],
            initializedFilters: [],
            displayMode: 'unavailable',
            degraded: true,
            fallbackReason: FilterSuggestionFallbackReason::Unavailable->value,
            resolutionPath: FilterSuggestionResolutionPath::Unavailable->value,
        );
    }

    /**
     * @param  array<string, mixed>  $normalizedCatalogFilters
     * @return array{products?: FilterSuggestionResult, services?: FilterSuggestionResult}
     */
    public function suggestCatalogSearchUncached(array $normalizedCatalogFilters, ?string $locale = null): array
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
            $results['products'] = $this->suggest($context, $engineFilters, $locale);
        }

        if ($type === 'all' || $type === 'services') {
            $engineFilters = $this->normalizer->serviceEngineFilters($normalizedCatalogFilters);
            $context = FilterContextFactory::fromEngineFilters(
                FilterContentType::Service,
                FilterSurface::CatalogSearch,
                $engineFilters,
                $locale,
            );
            $results['services'] = $this->suggest($context, $engineFilters, $locale);
        }

        return $results;
    }

    /**
     * @param  list<FilterSuggestion>  $suggestions
     * @return list<FilterSuggestion>
     */
    private function localize(array $suggestions, ?string $locale, string $source): array
    {
        $previous = app()->getLocale();

        if ($locale !== null && $locale !== '') {
            app()->setLocale($locale);
        }

        $localized = array_map(function (FilterSuggestion $suggestion) use ($source): FilterSuggestion {
            $filterKey = $suggestion->filterKey;
            $reasonKey = $suggestion->reasonCode->value;

            $withLabels = new FilterSuggestion(
                filterKey: $suggestion->filterKey,
                group: $suggestion->group,
                presentation: $suggestion->presentation,
                priority: $suggestion->priority,
                action: $suggestion->action,
                reasonCode: $suggestion->reasonCode,
                queryParameters: $suggestion->queryParameters,
                values: $suggestion->values,
                bounds: $suggestion->bounds,
                label: __("diyar.catalog.filter_suggestions.filters.{$filterKey}"),
                reason: __("diyar.catalog.filter_suggestions.reasons.{$reasonKey}"),
                source: $source,
            );

            return new FilterSuggestion(
                filterKey: $withLabels->filterKey,
                group: $withLabels->group,
                presentation: $withLabels->presentation,
                priority: $withLabels->priority,
                action: $withLabels->action,
                reasonCode: $withLabels->reasonCode,
                queryParameters: $withLabels->queryParameters,
                values: $withLabels->values,
                bounds: $withLabels->bounds,
                label: $withLabels->label,
                reason: $withLabels->reason,
                apply: $this->applyResolver->resolve($withLabels),
                source: $source,
            );
        }, $suggestions);

        app()->setLocale($previous);

        return $localized;
    }
}
