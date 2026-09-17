<?php

namespace App\Support\Catalog\Filters\Context;

use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;

final class FilterContextFactory
{
    /**
     * @param  array<string, mixed>  $normalizedFilters  Output from CatalogFilterNormalizer engine bags.
     */
    public static function fromEngineFilters(
        FilterContentType $contentType,
        FilterSurface $surface,
        array $normalizedFilters,
        ?string $locale = null,
    ): FilterContext {
        $categorySlug = isset($normalizedFilters['category_slug'])
            ? (string) $normalizedFilters['category_slug']
            : (isset($normalizedFilters['category']) ? (string) $normalizedFilters['category'] : null);

        $searchQuery = isset($normalizedFilters['q'])
            ? trim((string) $normalizedFilters['q'])
            : null;

        $sort = isset($normalizedFilters['sort']) ? (string) $normalizedFilters['sort'] : null;

        $activeFilters = $normalizedFilters;
        unset(
            $activeFilters['q'],
            $activeFilters['category_slug'],
            $activeFilters['category'],
            $activeFilters['sort'],
            $activeFilters['page'],
            $activeFilters['per_page'],
            $activeFilters['type'],
        );

        $activeFilters = FilterContextSignature::normalizeFilters($activeFilters);

        return new FilterContext(
            contentType: $contentType,
            surface: $surface,
            categorySlug: $categorySlug !== '' ? $categorySlug : null,
            searchQuery: $searchQuery !== '' ? $searchQuery : null,
            activeFilters: $activeFilters,
            locale: $locale !== '' ? $locale : null,
            sort: $sort !== '' ? $sort : null,
        );
    }
}
