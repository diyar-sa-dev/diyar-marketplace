<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Services\Catalog\CachedFilterSuggestionService;
use App\Services\Catalog\CachedFilterContextSummaryService;
use App\Services\Catalog\FilterSuggestionService;
use App\Services\Catalog\FilterSuggestionTelemetry;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\VersionedCache;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\Context\FilterContextSignature;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionFallbackReason;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\Depends;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;
use Tests\TestCase;

class FilterSuggestionResilienceTest extends TestCase
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

    protected function tearDown(): void
    {
        $this->resetFilterSuggestionIsolationState();

        parent::tearDown();
    }

    /**
     * Reset container bindings polluted by instance()/mock() and config/cache mutations.
     */
    private function resetFilterSuggestionIsolationState(): void
    {
        foreach ([
            CachedFilterContextSummaryService::class,
            CachedFilterSuggestionService::class,
            FilterSuggestionService::class,
            FilterSuggestionTelemetry::class,
        ] as $class) {
            $this->app->forgetInstance($class);
            if ($this->app->bound($class)) {
                $this->app->offsetUnset($class);
            }
            $this->app->bind($class, $class);
        }

        config(['diyar.catalog.filter_suggestions.enabled' => true]);
        Cache::flush();
    }

    #[Test]
    public function registry_only_fallback_executes_zero_database_queries(): void
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

        $result = app(FilterSuggestionService::class)->suggestRegistryOnly($context, 'en');

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertSame(0, count($queries));
        $this->assertTrue($result->degraded);
        $this->assertSame(FilterSuggestionFallbackReason::RegistryOnly->value, $result->fallbackReason);
        $this->assertSame('registry_only', $result->resolutionPath);
        $this->assertContains($result->displayMode, ['initialized', 'unavailable']);
    }

    #[Test]
    public function database_failure_falls_back_to_registry_only_response(): void
    {
        Cache::flush();

        $this->mock(CachedFilterContextSummaryService::class, function ($mock): void {
            $mock->shouldReceive('summarize')->andThrow(new RuntimeException('database unavailable'));
        });

        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom');

        $response->assertOk();

        $section = $response->json('data.products');

        $this->assertTrue($section['degraded']);
        $this->assertSame(FilterSuggestionFallbackReason::RegistryOnly->value, $section['fallback_reason']);
        $this->assertContains($section['display_mode'], ['initialized', 'unavailable']);
    }

    #[Test]
    public function stale_cache_is_used_when_generation_fails(): void
    {
        Cache::flush();

        $filters = app(CatalogFilterNormalizer::class)->normalizeForCatalogSearch([
            'type' => 'products',
            'category_slug' => 'bedroom',
        ]);

        $service = app(CachedFilterSuggestionService::class);
        $fresh = $service->suggestCatalogSearch($filters, 'en')['products'];

        $engineFilters = app(CatalogFilterNormalizer::class)->productEngineFilters($filters);
        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::CatalogSearch,
            $engineFilters,
            'en',
        );
        $signature = FilterContextSignature::make($context);
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        Cache::forget(CacheKeys::catalogFilterSuggestions($signature, $version, 'en'));

        $this->mock(CachedFilterContextSummaryService::class, function ($mock): void {
            $mock->shouldReceive('summarize')->andThrow(new RuntimeException('database unavailable'));
        });
        $this->app->forgetInstance(FilterSuggestionService::class);
        $this->app->forgetInstance(CachedFilterSuggestionService::class);

        $degraded = app(CachedFilterSuggestionService::class)->suggestCatalogSearch($filters, 'en')['products'];

        $this->assertTrue($degraded->degraded);
        $this->assertSame(FilterSuggestionFallbackReason::StaleCache->value, $degraded->fallbackReason);
        $this->assertSame('stale_cache', $degraded->resolutionPath);
        $this->assertSame($fresh->displayMode, $degraded->displayMode);
    }

    #[Test]
    public function malformed_fresh_cache_is_ignored_and_regenerated(): void
    {
        Cache::flush();

        $filters = app(CatalogFilterNormalizer::class)->normalizeForCatalogSearch([
            'type' => 'products',
            'category_slug' => 'bedroom',
        ]);

        $engineFilters = app(CatalogFilterNormalizer::class)->productEngineFilters($filters);
        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::CatalogSearch,
            $engineFilters,
            'en',
        );
        $signature = FilterContextSignature::make($context);
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogFilterSuggestions($signature, $version, 'en');

        Cache::put($cacheKey, ['invalid' => true], 120);

        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom');

        $response->assertOk();
        $this->assertContains($response->json('data.products.display_mode'), ['ranked', 'initialized', 'unavailable']);
    }

    #[Test]
    public function healthy_initialized_response_is_not_degraded(): void
    {
        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom');

        $response->assertOk();

        $section = $response->json('data.products');

        if ($section['display_mode'] === 'initialized') {
            $this->assertNotTrue($section['degraded'] ?? false);
            $this->assertContains($section['resolution_path'], ['fresh_cache', 'fresh_generate']);
        }
    }

    #[Test]
    public function telemetry_failure_is_isolated(): void
    {
        Log::shouldReceive('info')->andThrow(new RuntimeException('logging unavailable'));
        Log::shouldReceive('warning')->zeroOrMoreTimes();

        app(FilterSuggestionTelemetry::class)->record(['cache_hit' => true]);

        $this->assertTrue(true);
    }

    #[Test]
    public function disabled_feature_returns_structured_unavailable_response(): void
    {
        config(['diyar.catalog.filter_suggestions.enabled' => false]);

        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom');

        $response->assertOk();

        $section = $response->json('data.products');

        $this->assertSame('unavailable', $section['display_mode']);
        $this->assertTrue($section['degraded']);
        $this->assertSame(FilterSuggestionFallbackReason::Disabled->value, $section['fallback_reason']);
    }

    #[Test]
    public function cache_hit_latency_is_bounded_on_repeated_requests(): void
    {
        Cache::flush();

        $url = '/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom';

        $this->getJson($url)->assertOk();

        $samples = [];

        for ($i = 0; $i < 5; $i++) {
            $started = hrtime(true);
            $this->getJson($url)->assertOk();
            $samples[] = (hrtime(true) - $started) / 1_000_000;
        }

        sort($samples);
        $p95 = $samples[(int) floor(count($samples) * 0.95)] ?? $samples[array_key_last($samples)];

        $this->assertLessThan(500, $p95, 'Cache-hit p95 should remain under 500ms in test environment.');
    }

    #[Test]
    public function polluting_database_failure_mock_produces_degraded_response(): void
    {
        Cache::flush();

        $this->mock(CachedFilterContextSummaryService::class, function ($mock): void {
            $mock->shouldReceive('summarize')->andThrow(new RuntimeException('database unavailable'));
        });

        $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom')
            ->assertOk()
            ->assertJsonPath('data.products.degraded', true);
    }

    #[Test]
    #[Depends('polluting_database_failure_mock_produces_degraded_response')]
    public function subsequent_request_after_polluting_mock_is_not_degraded_when_initialized(): void
    {
        Cache::flush();

        $response = $this->getJson('/api/v1/catalog/search/filter-suggestions?type=products&category_slug=bedroom');
        $response->assertOk();

        $section = $response->json('data.products');
        if (($section['display_mode'] ?? null) === 'initialized') {
            $this->assertNotTrue($section['degraded'] ?? false);
            $this->assertContains($section['resolution_path'], ['fresh_cache', 'fresh_generate']);
        }
    }
}
