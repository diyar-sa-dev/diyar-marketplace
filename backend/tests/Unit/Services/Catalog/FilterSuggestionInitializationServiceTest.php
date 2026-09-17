<?php

namespace Tests\Unit\Services\Catalog;

use App\Services\Catalog\FilterSuggestionInitializationService;
use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextMeta;
use App\Support\Catalog\Filters\Context\FilterContextSummary;
use App\Support\Catalog\Filters\Context\FilterPriceSummary;
use App\Support\Catalog\Filters\Context\FilterStatisticSummary;
use App\Support\Catalog\Filters\FilterCapabilityRegistry;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionAction;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionEligibility;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionGroup;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionReasonCode;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterSuggestionInitializationServiceTest extends TestCase
{
    private FilterSuggestionInitializationService $initializer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initializer = new FilterSuggestionInitializationService(
            new FilterCapabilityRegistry,
            new FilterSuggestionEligibility,
        );
    }

    #[Test]
    public function product_context_initializes_registry_backed_filters(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: null,
            activeFilters: [],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Product,
                surface: FilterSurface::CatalogSearch,
                resultCount: 120,
                resultDensity: 'high',
                confidence: 'high',
            ),
            price: new FilterPriceSummary(min: 450.0, max: 5200.0, avg: 1800.0),
            filterStatistics: [
                'colors' => new FilterStatisticSummary(
                    distinctCount: 4,
                    dominantShare: 0.33,
                    distributionBalance: 0.6,
                    availableValueCount: 4,
                    topValues: [
                        ['value' => 'white', 'count' => 40, 'share' => 0.33],
                    ],
                ),
            ],
        );

        $initialized = $this->initializer->initialize($context, $summary);

        $this->assertNotEmpty($initialized);
        $this->assertSame('initialized', $initialized[0]->source);
        $this->assertSame(FilterSuggestionReasonCode::StartNarrowing, $initialized[0]->reasonCode);
        $this->assertSame(FilterSuggestionAction::Narrow, $initialized[0]->action);

        $keys = array_map(static fn ($item) => $item->filterKey, $initialized);
        $this->assertContains('price_range', $keys);
        $this->assertNotContains('material', $keys);
    }

    #[Test]
    public function active_filters_are_excluded_from_initialization(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: null,
            activeFilters: ['discounted' => true, 'min_price' => 500],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Product,
                surface: FilterSurface::CatalogSearch,
                resultCount: 50,
                resultDensity: 'medium',
                confidence: 'medium',
            ),
            price: new FilterPriceSummary(min: 450.0, max: 5200.0, avg: 1800.0),
            filterStatistics: [],
        );

        $initialized = $this->initializer->initialize($context, $summary);
        $keys = array_map(static fn ($item) => $item->filterKey, $initialized);

        $this->assertNotContains('discounted', $keys);
        $this->assertNotContains('price_range', $keys);
    }

    #[Test]
    public function initialization_respects_group_diversity(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: null,
            searchQuery: null,
            activeFilters: [],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Product,
                surface: FilterSurface::CatalogSearch,
                resultCount: 500,
                resultDensity: 'high',
                confidence: 'high',
            ),
            price: new FilterPriceSummary(min: 100.0, max: 9000.0, avg: 2200.0),
            filterStatistics: [],
        );

        $initialized = $this->initializer->initialize($context, $summary);
        $groups = array_map(static fn ($item) => $item->group->value, $initialized);

        $this->assertSame($groups, array_values(array_unique($groups)));
        $this->assertLessThanOrEqual(4, count($initialized));
    }

    #[Test]
    public function service_context_prefers_service_capabilities(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Service,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'interior-design',
            searchQuery: null,
            activeFilters: [],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Service,
                surface: FilterSurface::CatalogSearch,
                resultCount: 80,
                resultDensity: 'medium',
                confidence: 'medium',
            ),
            price: new FilterPriceSummary(min: 200.0, max: 8000.0, avg: 2500.0),
            filterStatistics: [],
        );

        $initialized = $this->initializer->initialize($context, $summary);
        $keys = array_map(static fn ($item) => $item->filterKey, $initialized);

        $this->assertNotEmpty($initialized);
        $this->assertNotContains('colors', $keys);
        $this->assertTrue(
            count(array_intersect($keys, ['price_range', 'min_rating', 'location', 'remote', 'provider', 'pricing_mode'])) > 0,
        );
    }

    #[Test]
    public function ranked_groups_are_excluded_from_initialization(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: null,
            activeFilters: [],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Product,
                surface: FilterSurface::CatalogSearch,
                resultCount: 120,
                resultDensity: 'high',
                confidence: 'high',
            ),
            price: new FilterPriceSummary(min: 450.0, max: 5200.0, avg: 1800.0),
            filterStatistics: [],
        );

        $initialized = $this->initializer->initialize(
            $context,
            $summary,
            [FilterSuggestionGroup::PriceRange->value],
        );

        $groups = array_map(static fn ($item) => $item->group->value, $initialized);

        $this->assertNotContains(FilterSuggestionGroup::PriceRange->value, $groups);
    }
}
