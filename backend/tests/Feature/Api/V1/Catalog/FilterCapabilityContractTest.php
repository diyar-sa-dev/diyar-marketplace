<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Support\Catalog\Filters\CatalogFilterRuleBuilder;
use App\Support\Catalog\Filters\FilterCapabilityRegistry;
use App\Support\Catalog\Filters\FilterSurface;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterCapabilityContractTest extends TestCase
{
    #[Test]
    public function registry_query_parameters_are_covered_by_validation_rules(): void
    {
        $registry = new FilterCapabilityRegistry;
        $builder = new CatalogFilterRuleBuilder($registry);

        foreach ([FilterSurface::ProductListing, FilterSurface::ServiceListing, FilterSurface::CatalogSearch] as $surface) {
            $rules = $builder->rules($surface);

            foreach ($registry->queryParametersFor($surface) as $parameter) {
                $this->assertArrayHasKey(
                    $parameter,
                    $rules,
                    "Missing validation rule for [{$parameter}] on surface [{$surface->value}]",
                );
            }
        }
    }

    #[Test]
    public function product_engine_parameters_match_product_service_filter_keys(): void
    {
        $registry = new FilterCapabilityRegistry;

        $expectedEngineKeys = [
            'q',
            'category_id',
            'category_slug',
            'vendor_id',
            'vendor_slug',
            'colors',
            'material',
            'availability_mode',
            'product_type',
            'discounted',
            'min_price',
            'max_price',
            'sort',
            'page',
            'per_page',
        ];

        sort($expectedEngineKeys);

        $registryKeys = $registry->engineParametersFor(\App\Support\Catalog\Filters\FilterContentType::Product);
        $registryKeys[] = 'page';
        $registryKeys[] = 'per_page';
        $registryKeys = array_values(array_unique($registryKeys));
        sort($registryKeys);

        $this->assertSame($expectedEngineKeys, $registryKeys);
    }

    #[Test]
    public function service_engine_parameters_match_service_catalog_filter_keys(): void
    {
        $registry = new FilterCapabilityRegistry;

        $expectedEngineKeys = [
            'q',
            'category',
            'location',
            'pricing_mode',
            'min_price',
            'max_price',
            'min_rating',
            'remote',
            'provider',
            'sort',
            'page',
            'per_page',
        ];

        sort($expectedEngineKeys);

        $registryKeys = $registry->engineParametersFor(\App\Support\Catalog\Filters\FilterContentType::Service);
        $registryKeys[] = 'page';
        $registryKeys[] = 'per_page';
        $registryKeys = array_values(array_unique($registryKeys));
        sort($registryKeys);

        $this->assertSame($expectedEngineKeys, $registryKeys);
    }

    #[Test]
    public function every_enabled_capability_declares_at_least_one_surface(): void
    {
        $registry = new FilterCapabilityRegistry;

        foreach ($registry->all() as $capability) {
            if (! $capability->enabled) {
                continue;
            }

            $this->assertNotEmpty(
                $capability->surfaces,
                "Capability [{$capability->key}] must declare at least one surface.",
            );
        }
    }
}
