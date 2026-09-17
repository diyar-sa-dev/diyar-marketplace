<?php

namespace Tests\Unit\Support\Catalog\Filters;

use App\Support\Catalog\Filters\FilterCapabilityRegistry;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterCapabilityRegistryTest extends TestCase
{
    #[Test]
    public function registry_defines_product_and_service_capabilities(): void
    {
        $registry = new FilterCapabilityRegistry;

        $this->assertNotNull($registry->find('vendor_slug'));
        $this->assertNotNull($registry->find('location'));
        $this->assertNotNull($registry->find('min_rating'));
    }

    #[Test]
    public function ai_suggestable_excludes_internal_only_filters(): void
    {
        $registry = new FilterCapabilityRegistry;

        $productAiKeys = array_map(
            static fn ($cap) => $cap->key,
            $registry->aiSuggestable(FilterContentType::Product),
        );

        $this->assertContains('vendor_slug', $productAiKeys);
        $this->assertContains('colors', $productAiKeys);
        $this->assertNotContains('category_id', $productAiKeys);
        $this->assertNotContains('category_slug', $productAiKeys);
        $this->assertNotContains('vendor_id', $productAiKeys);
        $this->assertNotContains('product_type', $productAiKeys);
        $this->assertNotContains('material', $productAiKeys);

        $serviceAiKeys = array_map(
            static fn ($cap) => $cap->key,
            $registry->aiSuggestable(FilterContentType::Service),
        );

        $this->assertContains('pricing_mode', $serviceAiKeys);
        $this->assertContains('remote', $serviceAiKeys);
        $this->assertNotContains('location', $serviceAiKeys);
        $this->assertNotContains('service_category', $serviceAiKeys);
    }

    #[Test]
    public function catalog_search_surface_includes_service_only_filters(): void
    {
        $registry = new FilterCapabilityRegistry;
        $params = $registry->queryParametersFor(FilterSurface::CatalogSearch);

        $this->assertContains('location', $params);
        $this->assertContains('min_rating', $params);
        $this->assertContains('remote', $params);
        $this->assertContains('provider', $params);
        $this->assertContains('pricing_mode', $params);
    }
}
