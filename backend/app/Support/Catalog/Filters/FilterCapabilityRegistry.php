<?php

namespace App\Support\Catalog\Filters;

use App\Enums\AvailabilityMode;
use App\Enums\ProductType;
use App\Enums\ServicePricingMode;

final class FilterCapabilityRegistry
{
    /** @var list<FilterCapability>|null */
    private static ?array $capabilities = null;

    /**
     * @return list<FilterCapability>
     */
    public function all(): array
    {
        return self::definitions();
    }

    /**
     * @return list<FilterCapability>
     */
    public function forSurface(FilterSurface $surface): array
    {
        return array_values(array_filter(
            self::definitions(),
            static fn (FilterCapability $cap): bool => $cap->enabled && in_array($surface, $cap->surfaces, true),
        ));
    }

    /**
     * @return list<FilterCapability>
     */
    public function forContentType(FilterContentType $contentType): array
    {
        return array_values(array_filter(
            self::definitions(),
            static fn (FilterCapability $cap): bool => $cap->enabled && (
                $cap->contentType === $contentType || $cap->contentType === FilterContentType::Shared
            ),
        ));
    }

    /**
     * @return list<FilterCapability>
     */
    public function aiSuggestable(FilterContentType $contentType): array
    {
        return array_values(array_filter(
            $this->forContentType($contentType),
            static fn (FilterCapability $cap): bool => $cap->aiSuggestable,
        ));
    }

    public function find(string $key): ?FilterCapability
    {
        foreach (self::definitions() as $capability) {
            if ($capability->key === $key) {
                return $capability;
            }
        }

        return null;
    }

    /**
     * Query parameter names accepted on a given surface (deduplicated).
     *
     * @return list<string>
     */
    public function queryParametersFor(FilterSurface $surface): array
    {
        $params = [];

        foreach ($this->forSurface($surface) as $capability) {
            foreach ($capability->queryParameters as $parameter) {
                $params[$parameter] = true;
            }
        }

        return array_keys($params);
    }

    /**
     * Engine parameter names passed to ProductService / ServiceCatalogService after normalization.
     *
     * @return list<string>
     */
    public function engineParametersFor(FilterContentType $contentType): array
    {
        $params = [];

        foreach ($this->forContentType($contentType) as $capability) {
            if ($capability->key === 'type') {
                continue;
            }

            $params[$capability->engineParameter] = true;
        }

        return array_keys($params);
    }

    /**
     * @return list<FilterCapability>
     */
    private static function definitions(): array
    {
        if (self::$capabilities !== null) {
            return self::$capabilities;
        }

        $allListingSurfaces = [
            FilterSurface::ProductListing,
            FilterSurface::ServiceListing,
            FilterSurface::CatalogSearch,
        ];

        $productListingSurfaces = [
            FilterSurface::ProductListing,
            FilterSurface::CatalogSearch,
        ];

        $serviceListingSurfaces = [
            FilterSurface::ServiceListing,
            FilterSurface::CatalogSearch,
        ];

        self::$capabilities = [
            new FilterCapability(
                key: 'q',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Like],
                presentation: FilterPresentation::Text,
                queryParameters: ['q'],
                engineParameter: 'q',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $allListingSurfaces,
            ),
            new FilterCapability(
                key: 'min_price',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::RangeMin,
                operators: [FilterOperator::Gte],
                presentation: FilterPresentation::Range,
                queryParameters: ['min_price'],
                engineParameter: 'min_price',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $allListingSurfaces,
            ),
            new FilterCapability(
                key: 'max_price',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::RangeMax,
                operators: [FilterOperator::Lte],
                presentation: FilterPresentation::Range,
                queryParameters: ['max_price'],
                engineParameter: 'max_price',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $allListingSurfaces,
            ),
            new FilterCapability(
                key: 'sort',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::Enum,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['sort'],
                engineParameter: 'sort',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $allListingSurfaces,
                enumValues: null,
            ),
            new FilterCapability(
                key: 'page',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::Integer,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Hidden,
                queryParameters: ['page'],
                engineParameter: 'page',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $allListingSurfaces,
            ),
            new FilterCapability(
                key: 'per_page',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::Integer,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Hidden,
                queryParameters: ['per_page'],
                engineParameter: 'per_page',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $allListingSurfaces,
            ),
            new FilterCapability(
                key: 'type',
                contentType: FilterContentType::Shared,
                valueType: FilterValueType::Enum,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['type'],
                engineParameter: 'type',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: [FilterSurface::CatalogSearch],
                enumValues: ['all', 'products', 'services'],
            ),
            new FilterCapability(
                key: 'category_slug',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['category_slug'],
                engineParameter: 'category_slug',
                facetSource: 'facets.categories',
                aiSuggestable: false,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'category_id',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::Uuid,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Hidden,
                queryParameters: ['category_id'],
                engineParameter: 'category_id',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'vendor_id',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::Uuid,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Hidden,
                queryParameters: ['vendor_id'],
                engineParameter: 'vendor_id',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'vendor_slug',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::MultiSelect,
                queryParameters: ['vendor_slug'],
                engineParameter: 'vendor_slug',
                facetSource: 'facets.vendors',
                aiSuggestable: true,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'colors',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::StringList,
                operators: [FilterOperator::In],
                presentation: FilterPresentation::MultiSelect,
                queryParameters: ['colors', 'color'],
                engineParameter: 'colors',
                facetSource: 'facets.colors',
                aiSuggestable: true,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'material',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Like],
                presentation: FilterPresentation::Text,
                queryParameters: ['material'],
                engineParameter: 'material',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'availability_mode',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::Enum,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['availability_mode'],
                engineParameter: 'availability_mode',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $productListingSurfaces,
                enumValues: array_map(static fn (AvailabilityMode $mode): string => $mode->value, AvailabilityMode::cases()),
            ),
            new FilterCapability(
                key: 'product_type',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::Enum,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Hidden,
                queryParameters: ['product_type'],
                engineParameter: 'product_type',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $productListingSurfaces,
                enumValues: array_map(static fn (ProductType $type): string => $type->value, ProductType::cases()),
            ),
            new FilterCapability(
                key: 'discounted',
                contentType: FilterContentType::Product,
                valueType: FilterValueType::Boolean,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Boolean,
                queryParameters: ['discounted'],
                engineParameter: 'discounted',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $productListingSurfaces,
            ),
            new FilterCapability(
                key: 'service_category',
                contentType: FilterContentType::Service,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['category', 'category_slug'],
                engineParameter: 'category',
                facetSource: 'service_categories',
                aiSuggestable: false,
                enabled: true,
                surfaces: $serviceListingSurfaces,
            ),
            new FilterCapability(
                key: 'location',
                contentType: FilterContentType::Service,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Like],
                presentation: FilterPresentation::Text,
                queryParameters: ['location'],
                engineParameter: 'location',
                facetSource: null,
                aiSuggestable: false,
                enabled: true,
                surfaces: $serviceListingSurfaces,
            ),
            new FilterCapability(
                key: 'pricing_mode',
                contentType: FilterContentType::Service,
                valueType: FilterValueType::Enum,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['pricing_mode'],
                engineParameter: 'pricing_mode',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $serviceListingSurfaces,
                enumValues: array_map(static fn (ServicePricingMode $mode): string => $mode->value, ServicePricingMode::cases()),
            ),
            new FilterCapability(
                key: 'min_rating',
                contentType: FilterContentType::Service,
                valueType: FilterValueType::Numeric,
                operators: [FilterOperator::Gte],
                presentation: FilterPresentation::Minimum,
                queryParameters: ['min_rating'],
                engineParameter: 'min_rating',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $serviceListingSurfaces,
            ),
            new FilterCapability(
                key: 'remote',
                contentType: FilterContentType::Service,
                valueType: FilterValueType::Boolean,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Boolean,
                queryParameters: ['remote'],
                engineParameter: 'remote',
                facetSource: null,
                aiSuggestable: true,
                enabled: true,
                surfaces: $serviceListingSurfaces,
            ),
            new FilterCapability(
                key: 'provider',
                contentType: FilterContentType::Service,
                valueType: FilterValueType::String,
                operators: [FilterOperator::Eq],
                presentation: FilterPresentation::Select,
                queryParameters: ['provider'],
                engineParameter: 'provider',
                facetSource: 'providers',
                aiSuggestable: true,
                enabled: true,
                surfaces: $serviceListingSurfaces,
            ),
        ];

        return self::$capabilities;
    }

    /**
     * Reset cached definitions — testing only.
     */
    public static function flushCache(): void
    {
        self::$capabilities = null;
    }

    /**
     * @return list<string>
     */
    public static function productSortValues(): array
    {
        return [
            '-created_at',
            'created_at',
            'price',
            '-price',
            'name',
            '-name',
            '-discount',
            'discount',
            '-popular',
            'popular',
        ];
    }

    /**
     * @return list<string>
     */
    public static function serviceSortValues(): array
    {
        return [
            'latest',
            'rating',
            'price_asc',
            'price_desc',
            'most_requested',
        ];
    }

    /**
     * @return list<string>
     */
    public static function catalogSearchSortValues(): array
    {
        return [
            '-created_at',
            'created_at',
            'price',
            '-price',
            'name',
            '-name',
            '-discount',
            'discount',
            '-popular',
            'popular',
            'latest',
            'rating',
        ];
    }
}
