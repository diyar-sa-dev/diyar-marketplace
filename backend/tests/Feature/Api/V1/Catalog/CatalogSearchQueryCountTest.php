<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CatalogSearchQueryCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_search_avoids_per_card_review_fallback_queries(): void
    {
        Product::factory()->count(8)->create(['name' => 'Searchable Chair']);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/catalog/search?q=chair&type=products&per_page=8')
            ->assertOk()
            ->assertJsonPath('data.type', 'products');

        $perCardFallbackQueries = collect(DB::getQueryLog())
            ->filter(function (array $entry): bool {
                $sql = strtolower($entry['query']);

                if (! str_contains($sql, 'product_reviews') || ! str_contains($sql, 'product_id')) {
                    return false;
                }

                return str_starts_with(ltrim($sql), 'select count(*)')
                    || str_contains($sql, 'avg("rating")');
            })
            ->count();

        DB::disableQueryLog();

        $this->assertSame(
            0,
            $perCardFallbackQueries,
            'Catalog search product cards should not trigger per-card review fallback queries.',
        );
    }
}
