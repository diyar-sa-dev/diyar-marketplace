<?php

namespace Tests\Unit\Services\Catalog;

use App\Services\Catalog\FilterSuggestionRankingService;
use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextMeta;
use App\Support\Catalog\Filters\Context\FilterContextSummary;
use App\Support\Catalog\Filters\Context\FilterPriceSummary;
use App\Support\Catalog\Filters\Context\FilterRatingSummary;
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

class FilterSuggestionRankingServiceTest extends TestCase
{
    private FilterSuggestionRankingService $ranker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ranker = new FilterSuggestionRankingService(
            new FilterCapabilityRegistry,
            new FilterSuggestionEligibility,
        );
    }

    #[Test]
    public function zero_results_suggest_relaxing_active_filters(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: null,
            activeFilters: ['discounted' => true, 'min_price' => 5000],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Product,
                surface: FilterSurface::CatalogSearch,
                resultCount: 0,
                resultDensity: 'zero',
                confidence: 'none',
            ),
            price: null,
            filterStatistics: [],
        );

        $suggestions = $this->ranker->rank($context, $summary);

        $this->assertNotEmpty($suggestions);
        $this->assertSame(FilterSuggestionAction::Relax, $suggestions[0]->action);
        $this->assertSame(FilterSuggestionReasonCode::ZeroResultsRelaxFilters, $suggestions[0]->reasonCode);
    }

    #[Test]
    public function price_range_is_a_single_group_not_min_and_max_separately(): void
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

        $summary = $this->productSummary(
            resultCount: 120,
            density: 'high',
            price: new FilterPriceSummary(min: 450.0, max: 5200.0, avg: 1800.0),
            statistics: [
                'colors' => new FilterStatisticSummary(
                    distinctCount: 4,
                    dominantShare: 0.35,
                    distributionBalance: 0.65,
                    availableValueCount: 4,
                    topValues: [
                        ['value' => 'White', 'count' => 42, 'share' => 0.35],
                        ['value' => 'Beige', 'count' => 30, 'share' => 0.25],
                    ],
                ),
            ],
        );

        $suggestions = $this->ranker->rank($context, $summary);
        $groups = array_map(static fn ($s) => $s->group->value, $suggestions);

        $this->assertContains(FilterSuggestionGroup::PriceRange->value, $groups);
        $this->assertSame(1, count(array_filter($groups, static fn (string $g): bool => $g === FilterSuggestionGroup::PriceRange->value)));
    }

    #[Test]
    public function already_active_filters_are_not_suggested(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Product,
            surface: FilterSurface::CatalogSearch,
            categorySlug: 'bedroom',
            searchQuery: null,
            activeFilters: ['colors' => ['White']],
            locale: 'en',
            sort: null,
        );

        $summary = $this->productSummary(
            resultCount: 50,
            density: 'medium',
            price: new FilterPriceSummary(min: 100.0, max: 5000.0, avg: 1200.0),
            statistics: [
                'colors' => new FilterStatisticSummary(
                    distinctCount: 3,
                    dominantShare: 0.4,
                    distributionBalance: 0.6,
                    availableValueCount: 3,
                    topValues: [['value' => 'Beige', 'count' => 20, 'share' => 0.4]],
                ),
                'vendor_slug' => new FilterStatisticSummary(
                    distinctCount: 2,
                    dominantShare: 0.55,
                    distributionBalance: 0.45,
                    availableValueCount: 2,
                    topValues: [['value' => 'diyar-furniture', 'count' => 28, 'share' => 0.55]],
                ),
            ],
        );

        $suggestions = $this->ranker->rank($context, $summary);
        $keys = array_map(static fn ($s) => $s->filterKey, $suggestions);

        $this->assertNotContains('colors', $keys);
    }

    #[Test]
    public function dominant_share_filters_are_suppressed(): void
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

        $summary = $this->productSummary(
            resultCount: 200,
            density: 'high',
            price: new FilterPriceSummary(min: 100.0, max: 900.0, avg: 400.0),
            statistics: [
                'vendor_slug' => new FilterStatisticSummary(
                    distinctCount: 2,
                    dominantShare: 0.95,
                    distributionBalance: 0.05,
                    availableValueCount: 2,
                    topValues: [['value' => 'diyar-furniture', 'count' => 190, 'share' => 0.95]],
                ),
            ],
        );

        $suggestions = $this->ranker->rank($context, $summary);
        $keys = array_map(static fn ($s) => $s->filterKey, $suggestions);

        $this->assertNotContains('vendor_slug', $keys);
    }

    #[Test]
    public function service_suggestions_include_rating_when_available(): void
    {
        $context = new FilterContext(
            contentType: FilterContentType::Service,
            surface: FilterSurface::ServiceListing,
            categorySlug: 'interior-design',
            searchQuery: null,
            activeFilters: [],
            locale: 'en',
            sort: null,
        );

        $summary = new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Service,
                surface: FilterSurface::ServiceListing,
                resultCount: 20,
                resultDensity: 'low',
                confidence: 'low',
                categorySlug: 'interior-design',
            ),
            price: new FilterPriceSummary(min: 500.0, max: 8000.0, avg: 2500.0),
            filterStatistics: [
                'provider' => new FilterStatisticSummary(
                    distinctCount: 3,
                    dominantShare: 0.4,
                    distributionBalance: 0.6,
                    availableValueCount: 3,
                    topValues: [['value' => 'design-studio', 'count' => 8, 'share' => 0.4]],
                ),
            ],
            rating: new FilterRatingSummary(avg: 4.6, min: 3.8, max: 5.0),
        );

        $suggestions = $this->ranker->rank($context, $summary);
        $keys = array_map(static fn ($s) => $s->filterKey, $suggestions);

        $this->assertContains('min_rating', $keys);
    }

    #[Test]
    public function ranking_runs_without_database_queries(): void
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

        $summary = $this->productSummary(
            resultCount: 80,
            density: 'medium',
            price: new FilterPriceSummary(min: 300.0, max: 4000.0, avg: 1500.0),
            statistics: [],
        );

        $started = hrtime(true);

        for ($i = 0; $i < 1000; $i++) {
            $this->ranker->rank($context, $summary);
        }

        $elapsedMs = (hrtime(true) - $started) / 1_000_000;

        $this->assertLessThan(500, $elapsedMs, '1000 ranking passes should stay well under 500ms.');
    }

    /**
     * @param  array<string, FilterStatisticSummary>  $statistics
     */
    private function productSummary(int $resultCount, string $density, ?FilterPriceSummary $price, array $statistics): FilterContextSummary
    {
        return new FilterContextSummary(
            context: new FilterContextMeta(
                contentType: FilterContentType::Product,
                surface: FilterSurface::CatalogSearch,
                resultCount: $resultCount,
                resultDensity: $density,
                confidence: 'high',
                categorySlug: 'bedroom',
            ),
            price: $price,
            filterStatistics: $statistics,
        );
    }
}
