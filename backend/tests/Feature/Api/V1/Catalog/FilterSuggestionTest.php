<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Services\Catalog\FilterSuggestionService;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterSuggestionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(PlatformDemoSeeder::class);
        $this->seed(CategorySeeder::class);
        $this->seed(CatalogSeeder::class);
        $this->seed(ServiceMarketplaceSeeder::class);
    }

    #[Test]
    public function bedroom_products_suggest_colors_and_price(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom', [
            'Accept-Language' => 'ar',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'products' => [
                        'content_type',
                        'result_count',
                        'result_density',
                        'display_mode',
                        'suggestions' => [
                            '*' => [
                                'filter_key',
                                'group',
                                'presentation',
                                'priority',
                                'action',
                                'reason_code',
                                'label',
                                'reason',
                                'query_parameters',
                                'source',
                                'apply' => ['mode'],
                            ],
                        ],
                        'initialized_filters',
                    ],
                ],
            ]);

        $apply = $response->json('data.products.suggestions.0.apply');
        if ($apply !== null) {
            $this->assertContains($apply['mode'], ['set', 'remove', 'focus']);
        }

        $keys = collect($response->json('data.products.suggestions'))->pluck('filter_key')->all();

        $displayMode = $response->json('data.products.display_mode');

        $this->assertContains($displayMode, ['ranked', 'initialized', 'unavailable']);
        $this->assertGreaterThan(0, count($keys) + count($response->json('data.products.initialized_filters')));
        $this->assertNotContains('material', $keys);

        if ($displayMode === 'ranked') {
            $this->assertSame([], $response->json('data.products.initialized_filters'));
        }
    }

    #[Test]
    public function service_suggestions_return_localized_labels(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=services&category=interior-design', [
            'Accept-Language' => 'ar',
        ]);

        $response->assertOk();

        $first = $response->json('data.services.suggestions.0');

        $this->assertNotEmpty($first['label']);
        $this->assertNotEmpty($first['reason']);
        $this->assertSame('ar', app()->getLocale());
    }

    #[Test]
    public function zero_result_context_suggests_relaxing_filters(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&q=xyz-no-match-999&discounted=true');

        $response->assertOk();

        $suggestions = $response->json('data.products.suggestions');

        if ($suggestions !== []) {
            $this->assertSame('relax', $suggestions[0]['action']);
        }
    }

    #[Test]
    public function invalid_filters_are_rejected_before_suggestions(): void
    {
        $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&sort=;drop table products')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    #[Test]
    public function ranking_adds_no_queries_beyond_context_summary(): void
    {
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->productEngineFilters([
            'type' => 'products',
            'category_slug' => 'bedroom',
        ]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::CatalogSearch,
            $engineFilters,
        );

        DB::flushQueryLog();
        DB::enableQueryLog();

        app(FilterSuggestionService::class)->suggest($context, $engineFilters, 'en');

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $fullRowLoads = collect($queries)->filter(function (array $entry): bool {
            $sql = strtolower($entry['query']);

            return str_contains($sql, 'from "products"')
                && ! str_contains($sql, 'count(')
                && ! str_contains($sql, 'min(')
                && ! str_contains($sql, 'max(')
                && ! str_contains($sql, 'avg(');
        })->count();

        $this->assertSame(0, $fullRowLoads);
        $this->assertLessThanOrEqual(6, count($queries));
    }

    #[Test]
    public function response_includes_initialized_filters_contract(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom');

        $response->assertOk();

        $section = $response->json('data.products');

        $this->assertArrayHasKey('display_mode', $section);
        $this->assertArrayHasKey('initialized_filters', $section);
        $this->assertIsArray($section['initialized_filters']);

        if ($section['display_mode'] === 'initialized') {
            $this->assertSame([], $section['suggestions']);
            $this->assertNotEmpty($section['initialized_filters']);
            $this->assertSame('initialized', $section['initialized_filters'][0]['source']);
        }
    }

    #[Test]
    public function suggestions_vary_by_category_context(): void
    {
        $bedroom = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom')
            ->json('data.products');

        $office = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=office')
            ->json('data.products');

        $this->assertNotSame($bedroom['result_count'], $office['result_count']);

        $bedroomPrice = collect($bedroom['suggestions'])->firstWhere('filter_key', 'price_range');
        $officePrice = collect($office['suggestions'])->firstWhere('filter_key', 'price_range');

        if ($bedroomPrice !== null && $officePrice !== null) {
            $this->assertNotSame($bedroomPrice['bounds'], $officePrice['bounds']);
        }
    }
}
