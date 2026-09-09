<?php

namespace Tests\Unit\Support\Catalog\Filters\Context;

use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextSignature;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterContextSignatureTest extends TestCase
{
    private function context(array $activeFilters = []): FilterContext
    {
        return new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: 'sofa',
            activeFilters: $activeFilters,
            locale: 'ar',
            sort: '-created_at',
        );
    }

    #[Test]
    public function same_logical_filters_produce_identical_signatures(): void
    {
        $a = $this->context(['min_price' => 100, 'max_price' => 500, 'discounted' => true]);
        $b = $this->context(['max_price' => 500, 'min_price' => 100, 'discounted' => 'true']);

        $this->assertSame(FilterContextSignature::make($a), FilterContextSignature::make($b));
    }

    #[Test]
    public function pagination_is_excluded_from_context_object_and_signature_differs_by_real_filters(): void
    {
        $withDiscount = $this->context(['discounted' => true]);
        $withoutDiscount = $this->context([]);

        $this->assertNotSame(
            FilterContextSignature::make($withDiscount),
            FilterContextSignature::make($withoutDiscount),
        );
    }

    #[Test]
    public function boolean_like_strings_normalize_consistently(): void
    {
        $filtersA = FilterContextSignature::normalizeFilters(['discounted' => '1', 'remote' => 'false']);
        $filtersB = FilterContextSignature::normalizeFilters(['discounted' => true, 'remote' => false]);

        $this->assertSame($filtersA, $filtersB);
    }

    #[Test]
    public function array_values_are_sorted_for_stable_signatures(): void
    {
        $a = FilterContextSignature::normalizeFilters(['colors' => ['Black', 'White', 'Beige']]);
        $b = FilterContextSignature::normalizeFilters(['colors' => ['Beige', 'Black', 'White']]);

        $this->assertSame($a, $b);
    }

    #[Test]
    public function different_search_queries_produce_different_signatures(): void
    {
        $a = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: 'sofa',
            activeFilters: [],
            locale: 'ar',
            sort: null,
        );

        $b = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: 'table',
            activeFilters: [],
            locale: 'ar',
            sort: null,
        );

        $this->assertNotSame(FilterContextSignature::make($a), FilterContextSignature::make($b));
    }
}
