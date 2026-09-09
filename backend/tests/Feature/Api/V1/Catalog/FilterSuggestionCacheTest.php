<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Services\Catalog\CachedFilterSuggestionService;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\PlatformDemoSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterSuggestionCacheTest extends TestCase
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
    public function cached_suggestion_service_adds_no_database_queries_on_hit(): void
    {
        Cache::flush();

        $filters = app(CatalogFilterNormalizer::class)->normalizeForCatalogSearch([
            'type' => 'products',
            'category_slug' => 'bedroom',
        ]);

        $service = app(CachedFilterSuggestionService::class);
        $service->suggestCatalogSearch($filters, 'en');

        DB::flushQueryLog();
        DB::enableQueryLog();

        $service->suggestCatalogSearch($filters, 'en');

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertSame(0, count($queries));
    }
}
