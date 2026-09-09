<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Product;
use App\Models\VendorAccount;
use App\Services\Catalog\CachedFilterContextSummaryService;
use App\Services\Catalog\FilterContextSummaryService;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\VersionedCache;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\Context\FilterContextSignature;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterContextSummaryTest extends TestCase
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
    public function product_summary_matches_filtered_dataset(): void
    {
        $vendor = VendorAccount::query()->where('slug', 'diyar-furniture')->firstOrFail();
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->normalizeForProductListing([
            'vendor_slug' => $vendor->slug,
            'per_page' => 50,
        ]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::ProductListing,
            $engineFilters,
            'ar',
        );

        $summary = app(FilterContextSummaryService::class)->summarize($context, $engineFilters);

        $this->assertSame('product', $summary->context->contentType->value);
        $this->assertGreaterThan(0, $summary->context->resultCount);
        $this->assertNotNull($summary->price);
        $this->assertArrayNotHasKey('vendor_slug', $summary->filterStatistics);
        $this->assertSame(
            $summary->context->resultCount,
            Product::query()->publiclyVisible()->where('vendor_account_id', $vendor->id)->count(),
        );
    }

    #[Test]
    public function zero_result_context_returns_empty_statistics(): void
    {
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->normalizeForProductListing([
            'q' => 'xyz-no-match-12345',
        ]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::CatalogSearch,
            $engineFilters,
        );

        $summary = app(FilterContextSummaryService::class)->summarize($context, $engineFilters);

        $this->assertSame(0, $summary->context->resultCount);
        $this->assertSame('zero', $summary->context->resultDensity);
        $this->assertSame('none', $summary->context->confidence);
        $this->assertNull($summary->price);
        $this->assertSame([], $summary->filterStatistics);
    }

    #[Test]
    public function service_summary_includes_price_rating_and_provider_statistics(): void
    {
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->normalizeForServiceListing([
            'category' => 'interior-design',
        ]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Service,
            FilterSurface::ServiceListing,
            $engineFilters,
        );

        $summary = app(FilterContextSummaryService::class)->summarize($context, $engineFilters);

        $this->assertSame(4, $summary->context->resultCount);
        $this->assertNotNull($summary->price);
        $this->assertNotNull($summary->rating);
        $this->assertArrayHasKey('provider', $summary->filterStatistics);
        $this->assertGreaterThan(0, $summary->filterStatistics['provider']->distinctCount);
    }

    #[Test]
    public function catalog_search_summaries_differ_when_filters_change(): void
    {
        $cached = app(CachedFilterContextSummaryService::class);
        $normalizer = app(CatalogFilterNormalizer::class);

        $base = $normalizer->normalizeForCatalogSearch(['type' => 'products', 'category_slug' => 'living-room']);
        $discounted = $normalizer->normalizeForCatalogSearch([
            'type' => 'products',
            'category_slug' => 'living-room',
            'discounted' => true,
        ]);

        $baseSummary = $cached->summarizeCatalogSearch($base)['products'];
        $discountedSummary = $cached->summarizeCatalogSearch($discounted)['products'];

        $this->assertNotSame(
            FilterContextSignature::make(
                FilterContextFactory::fromEngineFilters(
                    FilterContentType::Product,
                    FilterSurface::CatalogSearch,
                    $normalizer->productEngineFilters($base),
                ),
            ),
            FilterContextSignature::make(
                FilterContextFactory::fromEngineFilters(
                    FilterContentType::Product,
                    FilterSurface::CatalogSearch,
                    $normalizer->productEngineFilters($discounted),
                ),
            ),
        );
        $this->assertGreaterThan(
            $discountedSummary->context->resultCount,
            $baseSummary->context->resultCount,
        );
    }

    #[Test]
    public function cache_hits_for_same_context_signature(): void
    {
        Cache::flush();

        $cached = app(CachedFilterContextSummaryService::class);
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

        $signature = FilterContextSignature::make($context);
        $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $cacheKey = CacheKeys::catalogFilterContextSummary($signature, $version);

        $this->assertFalse(Cache::has($cacheKey));

        $cached->summarize($context, $engineFilters);
        $this->assertTrue(Cache::has($cacheKey));

        $cached->summarize($context, $engineFilters);
        $this->assertTrue(Cache::has($cacheKey));
    }

    #[Test]
    public function invalid_filters_are_rejected_before_summary_generation(): void
    {
        $this->getJson('/api/v1/catalog/search?type=products&sort=;drop table products')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sort']);
    }

    #[Test]
    public function catalog_version_change_produces_new_cache_key(): void
    {
        Cache::flush();

        $cached = app(CachedFilterContextSummaryService::class);
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->productEngineFilters([
            'type' => 'products',
            'category_slug' => 'office',
        ]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::CatalogSearch,
            $engineFilters,
        );

        $signature = FilterContextSignature::make($context);
        $versionBefore = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $keyBefore = CacheKeys::catalogFilterContextSummary($signature, $versionBefore);

        $cached->summarize($context, $engineFilters);
        $this->assertTrue(Cache::has($keyBefore));

        VersionedCache::bump(CacheKeys::CATALOG_VERSION);
        $versionAfter = VersionedCache::version(CacheKeys::CATALOG_VERSION);
        $keyAfter = CacheKeys::catalogFilterContextSummary($signature, $versionAfter);

        $this->assertNotSame($keyBefore, $keyAfter);
        $this->assertFalse(Cache::has($keyAfter));

        $cached->summarize($context, $engineFilters);
        $this->assertTrue(Cache::has($keyAfter));
    }

    #[Test]
    public function very_small_result_sets_are_classified_as_very_low_density(): void
    {
        $vendor = VendorAccount::query()->where('slug', 'diyar-furniture')->firstOrFail();
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->normalizeForProductListing([
            'vendor_slug' => $vendor->slug,
            'q' => 'طاولة قهوة',
        ]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::ProductListing,
            $engineFilters,
        );

        $summary = app(FilterContextSummaryService::class)->summarize($context, $engineFilters);

        $this->assertSame(1, $summary->context->resultCount);
        $this->assertSame('very_low', $summary->context->resultDensity);
    }

    #[Test]
    public function summary_output_does_not_expose_internal_identifiers(): void
    {
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->normalizeForProductListing([]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::ProductListing,
            $engineFilters,
        );

        $payload = app(FilterContextSummaryService::class)
            ->summarize($context, $engineFilters)
            ->toArray();

        $encoded = json_encode($payload, JSON_THROW_ON_ERROR);

        $this->assertStringNotContainsString('vendor_account_id', $encoded);
        $this->assertStringNotContainsString('category_id', $encoded);
        $this->assertStringNotContainsString('provider_account_id', $encoded);
    }

    #[Test]
    public function aggregate_query_count_stays_within_budget(): void
    {
        $service = app(FilterContextSummaryService::class);
        $normalizer = app(CatalogFilterNormalizer::class);
        $engineFilters = $normalizer->normalizeForProductListing([]);

        $context = FilterContextFactory::fromEngineFilters(
            FilterContentType::Product,
            FilterSurface::ProductListing,
            $engineFilters,
        );

        $service->summarize($context, $engineFilters);

        $this->assertLessThanOrEqual(
            (int) config('diyar.catalog.filter_context.max_aggregate_queries', 6),
            $service->aggregateQueryCount(),
        );
    }
}
