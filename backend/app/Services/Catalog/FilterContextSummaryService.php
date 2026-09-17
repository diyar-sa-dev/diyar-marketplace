<?php

namespace App\Services\Catalog;

use App\Models\Product;
use App\Models\Service;
use App\Services\ServiceMarketplace\ServiceCatalogService;
use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextMeta;
use App\Support\Catalog\Filters\Context\FilterContextSummary;
use App\Support\Catalog\Filters\Context\FilterDistributionMetrics;
use App\Support\Catalog\Filters\Context\FilterPriceSummary;
use App\Support\Catalog\Filters\Context\FilterRatingSummary;
use App\Support\Catalog\Filters\Context\FilterStatisticSummary;
use App\Support\Catalog\Filters\Context\ResultDensityClassifier;
use App\Support\Catalog\Filters\FilterCapability;
use App\Support\Catalog\Filters\FilterCapabilityRegistry;
use App\Support\Catalog\Filters\FilterContentType;
use Illuminate\Database\Eloquent\Builder;

final class FilterContextSummaryService
{
    private int $aggregateQueries = 0;

    public function __construct(
        private readonly ProductService $products,
        private readonly ServiceCatalogService $services,
        private readonly FilterCapabilityRegistry $registry,
        private readonly ResultDensityClassifier $density,
    ) {}

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    public function summarize(FilterContext $context, array $engineFilters): FilterContextSummary
    {
        $this->aggregateQueries = 0;

        return match ($context->contentType) {
            FilterContentType::Product => $this->summarizeProducts($context, $engineFilters),
            FilterContentType::Service => $this->summarizeServices($context, $engineFilters),
            default => $this->emptySummary($context, 0),
        };
    }

    public function aggregateQueryCount(): int
    {
        return $this->aggregateQueries;
    }

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    private function summarizeProducts(FilterContext $context, array $engineFilters): FilterContextSummary
    {
        $query = $this->products->filteredPublicQuery($engineFilters);
        $base = $this->baseProductAggregate($query);
        $resultCount = (int) ($base['result_count'] ?? 0);

        if ($resultCount === 0) {
            return $this->emptySummary($context, 0);
        }

        $price = new FilterPriceSummary(
            min: (float) $base['min_price'],
            max: (float) $base['max_price'],
            avg: round((float) $base['avg_price'], 2),
        );

        $statistics = [];

        foreach ($this->registry->aiSuggestable(FilterContentType::Product) as $capability) {
            if (! $this->shouldCompute($context, $capability)) {
                continue;
            }

            if (! $this->withinAggregateBudget()) {
                break;
            }

            $statistic = match ($capability->key) {
                'vendor_slug' => $this->productVendorStatistics($query, $resultCount),
                'colors' => $this->productColorStatistics($query, $resultCount),
                'availability_mode' => $this->productAvailabilityStatistics($query, $resultCount),
                'discounted' => $this->productDiscountStatistics($query, $resultCount),
                default => null,
            };

            if ($statistic instanceof FilterStatisticSummary) {
                $statistics[$capability->key] = $statistic;
            }
        }

        return new FilterContextSummary(
            context: $this->buildMeta($context, $resultCount),
            price: $price,
            filterStatistics: $statistics,
        );
    }

    /**
     * @param  array<string, mixed>  $engineFilters
     */
    private function summarizeServices(FilterContext $context, array $engineFilters): FilterContextSummary
    {
        $query = $this->services->filteredPublicQuery($engineFilters);
        $base = $this->baseServiceAggregate($query);
        $resultCount = (int) ($base['result_count'] ?? 0);

        if ($resultCount === 0) {
            return $this->emptySummary($context, 0);
        }

        $price = new FilterPriceSummary(
            min: (float) $base['min_price'],
            max: (float) $base['max_price'],
            avg: round((float) $base['avg_price'], 2),
        );

        $rating = new FilterRatingSummary(
            avg: round((float) $base['avg_rating'], 2),
            min: round((float) $base['min_rating'], 2),
            max: round((float) $base['max_rating'], 2),
        );

        $statistics = [];

        foreach ($this->registry->aiSuggestable(FilterContentType::Service) as $capability) {
            if (! $this->shouldCompute($context, $capability)) {
                continue;
            }

            if (! $this->withinAggregateBudget()) {
                break;
            }

            $statistic = match ($capability->key) {
                'provider' => $this->serviceProviderStatistics($query, $resultCount),
                'location' => $this->serviceLocationStatistics($query, $resultCount),
                'pricing_mode' => $this->servicePricingModeStatistics($query, $resultCount),
                'remote' => $this->serviceRemoteStatistics($query, $resultCount),
                default => null,
            };

            if ($statistic instanceof FilterStatisticSummary) {
                $statistics[$capability->key] = $statistic;
            }
        }

        return new FilterContextSummary(
            context: $this->buildMeta($context, $resultCount),
            price: $price,
            filterStatistics: $statistics,
            rating: $rating,
        );
    }

    /**
     * @param  Builder<Product>  $query
     * @return array{result_count: int, min_price: float, max_price: float, avg_price: float}
     */
    private function baseProductAggregate(Builder $query): array
    {
        $this->aggregateQueries++;

        $row = (clone $query)
            ->selectRaw('COUNT(*) as result_count')
            ->selectRaw('MIN(sale_price) as min_price')
            ->selectRaw('MAX(sale_price) as max_price')
            ->selectRaw('AVG(sale_price) as avg_price')
            ->first();

        return [
            'result_count' => (int) ($row->result_count ?? 0),
            'min_price' => (float) ($row->min_price ?? 0),
            'max_price' => (float) ($row->max_price ?? 0),
            'avg_price' => (float) ($row->avg_price ?? 0),
        ];
    }

    /**
     * @param  Builder<Service>  $query
     * @return array{result_count: int, min_price: float, max_price: float, avg_price: float, avg_rating: float, min_rating: float, max_rating: float}
     */
    private function baseServiceAggregate(Builder $query): array
    {
        $this->aggregateQueries++;

        $row = (clone $query)
            ->selectRaw('COUNT(*) as result_count')
            ->selectRaw('MIN(starting_price) as min_price')
            ->selectRaw('MAX(starting_price) as max_price')
            ->selectRaw('AVG(starting_price) as avg_price')
            ->selectRaw('AVG(rating_average) as avg_rating')
            ->selectRaw('MIN(rating_average) as min_rating')
            ->selectRaw('MAX(rating_average) as max_rating')
            ->first();

        return [
            'result_count' => (int) ($row->result_count ?? 0),
            'min_price' => (float) ($row->min_price ?? 0),
            'max_price' => (float) ($row->max_price ?? 0),
            'avg_price' => (float) ($row->avg_price ?? 0),
            'avg_rating' => (float) ($row->avg_rating ?? 0),
            'min_rating' => (float) ($row->min_rating ?? 0),
            'max_rating' => (float) ($row->max_rating ?? 0),
        ];
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function productVendorStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->join('vendor_accounts', 'products.vendor_account_id', '=', 'vendor_accounts.id')
            ->where('vendor_accounts.status', 'active')
            ->select('vendor_accounts.slug as value')
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupBy('vendor_accounts.slug')
            ->orderByDesc('aggregate_count')
            ->limit($this->topValuesLimit())
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function productColorStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->join('product_colors', 'products.id', '=', 'product_colors.product_id')
            ->select('product_colors.name as value')
            ->selectRaw('COUNT(DISTINCT products.id) as aggregate_count')
            ->groupBy('product_colors.name')
            ->orderByDesc('aggregate_count')
            ->limit($this->topValuesLimit())
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function productAvailabilityStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->select('availability_mode as value')
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupBy('availability_mode')
            ->orderByDesc('aggregate_count')
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function productDiscountStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $row = (clone $query)
            ->selectRaw(
                'SUM(CASE WHEN compare_price IS NOT NULL AND compare_price > sale_price AND (promotion_ends_at IS NULL OR promotion_ends_at > ?) THEN 1 ELSE 0 END) as discounted_count',
                [now()],
            )
            ->selectRaw('COUNT(*) as total_count')
            ->first();

        $discounted = (int) ($row->discounted_count ?? 0);
        $notDiscounted = max($resultCount - $discounted, 0);

        return FilterDistributionMetrics::fromDistribution([
            'true' => $discounted,
            'false' => $notDiscounted,
        ], $resultCount);
    }

    /**
     * @param  Builder<Service>  $query
     */
    private function serviceProviderStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->join('provider_accounts', 'services.provider_account_id', '=', 'provider_accounts.id')
            ->select('provider_accounts.slug as value')
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupBy('provider_accounts.slug')
            ->orderByDesc('aggregate_count')
            ->limit($this->topValuesLimit())
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    /**
     * @param  Builder<Service>  $query
     */
    private function serviceLocationStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->selectRaw("COALESCE(NULLIF(TRIM(services.location), ''), 'unknown') as value")
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupByRaw("COALESCE(NULLIF(TRIM(services.location), ''), 'unknown')")
            ->orderByDesc('aggregate_count')
            ->limit($this->topValuesLimit())
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    /**
     * @param  Builder<Service>  $query
     */
    private function servicePricingModeStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->select('pricing_mode as value')
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupBy('pricing_mode')
            ->orderByDesc('aggregate_count')
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    /**
     * @param  Builder<Service>  $query
     */
    private function serviceRemoteStatistics(Builder $query, int $resultCount): FilterStatisticSummary
    {
        $this->aggregateQueries++;

        $rows = (clone $query)
            ->selectRaw("CASE WHEN remote_available = 1 THEN 'true' ELSE 'false' END as value")
            ->selectRaw('COUNT(*) as aggregate_count')
            ->groupBy('value')
            ->get()
            ->map(static fn ($row): array => [
                'value' => (string) $row->value,
                'count' => (int) $row->aggregate_count,
            ])
            ->all();

        return FilterDistributionMetrics::summarize($rows, $resultCount);
    }

    private function shouldCompute(FilterContext $context, FilterCapability $capability): bool
    {
        if (! $capability->enabled || ! $capability->aiSuggestable) {
            return false;
        }

        $lockedKeys = match ($capability->key) {
            'service_category', 'category_slug' => ['category', 'category_slug', 'category_id'],
            'vendor_slug' => ['vendor_slug', 'vendor_id'],
            'colors' => ['colors', 'color'],
            default => [$capability->engineParameter],
        };

        foreach ($lockedKeys as $key) {
            if (array_key_exists($key, $context->activeFilters)) {
                return false;
            }
        }

        if (in_array($capability->key, ['service_category', 'category_slug'], true) && $context->categorySlug !== null) {
            return false;
        }

        return true;
    }

    private function withinAggregateBudget(): bool
    {
        return $this->aggregateQueries < (int) config('diyar.catalog.filter_context.max_aggregate_queries', 6);
    }

    private function topValuesLimit(): int
    {
        return (int) config('diyar.catalog.filter_context.top_values_limit', 10);
    }

    private function buildMeta(FilterContext $context, int $resultCount): FilterContextMeta
    {
        return new FilterContextMeta(
            contentType: $context->contentType,
            surface: $context->surface,
            resultCount: $resultCount,
            resultDensity: $this->density->classify($resultCount),
            confidence: $this->density->confidence($resultCount),
            categorySlug: $context->categorySlug,
            searchQuery: $context->searchQuery,
            locale: $context->locale,
            sort: $context->sort,
        );
    }

    private function emptySummary(FilterContext $context, int $resultCount): FilterContextSummary
    {
        return new FilterContextSummary(
            context: $this->buildMeta($context, $resultCount),
            price: null,
            filterStatistics: [],
        );
    }
}
