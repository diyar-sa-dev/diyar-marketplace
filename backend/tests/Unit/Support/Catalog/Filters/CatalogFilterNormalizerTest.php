<?php

namespace Tests\Unit\Support\Catalog\Filters;

use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CatalogFilterNormalizerTest extends TestCase
{
    #[Test]
    public function normalizes_single_color_into_colors_list_for_products(): void
    {
        $normalizer = new CatalogFilterNormalizer;

        $result = $normalizer->normalizeForProductListing([
            'color' => ' Beige ',
            'colors' => 'White,Black',
        ]);

        $this->assertEqualsCanonicalizing(['Beige', 'White', 'Black'], $result['colors']);
        $this->assertArrayNotHasKey('color', $result);
    }

    #[Test]
    public function maps_category_slug_to_service_category_engine_parameter(): void
    {
        $normalizer = new CatalogFilterNormalizer;

        $serviceFilters = $normalizer->serviceEngineFilters([
            'category_slug' => 'interior-design',
            'sort' => 'rating',
        ]);

        $this->assertSame('interior-design', $serviceFilters['category']);
        $this->assertArrayNotHasKey('category_slug', $serviceFilters);
        $this->assertSame('rating', $serviceFilters['sort']);
    }

    #[Test]
    public function maps_catalog_search_sort_aliases_for_each_engine(): void
    {
        $normalizer = new CatalogFilterNormalizer;

        $productFilters = $normalizer->productEngineFilters(['sort' => 'latest']);
        $serviceFilters = $normalizer->serviceEngineFilters(['sort' => '-price']);

        $this->assertSame('-created_at', $productFilters['sort']);
        $this->assertSame('price_desc', $serviceFilters['sort']);
    }
}
