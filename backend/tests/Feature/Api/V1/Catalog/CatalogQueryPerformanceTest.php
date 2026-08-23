<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CatalogQueryPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_list_avoids_per_card_review_fallback_queries(): void
    {
        Product::factory()->count(8)->create();

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/v1/products?per_page=8')
            ->assertOk()
            ->assertJsonCount(8, 'data.items');

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
            'Product cards should not trigger per-card review count/avg fallback queries.',
        );
    }
}
