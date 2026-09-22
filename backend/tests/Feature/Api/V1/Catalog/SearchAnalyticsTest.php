<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Jobs\Search\RecordSearchQueryAnalyticsJob;
use App\Models\SearchQueryEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SearchAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_search_records_analytics_event(): void
    {
        $this->getJson('/api/v1/catalog/search?q=sofa&type=products')
            ->assertOk();

        $this->assertDatabaseHas('search_query_events', [
            'normalized_query' => 'sofa',
            'search_type' => 'products',
        ]);

        $event = SearchQueryEvent::query()->first();
        $this->assertNotNull($event);
        $this->assertNotNull($event->duration_ms);
    }

    public function test_catalog_search_succeeds_when_analytics_table_is_missing(): void
    {
        Schema::dropIfExists('search_query_events');

        $this->getJson('/api/v1/catalog/search?q=sofa&type=products')
            ->assertOk();
    }

    public function test_empty_query_does_not_record_analytics(): void
    {
        $this->getJson('/api/v1/catalog/search?type=products')->assertOk();

        $this->assertSame(0, SearchQueryEvent::query()->count());
    }

    public function test_catalog_search_dispatches_analytics_job_without_blocking_persistence(): void
    {
        Queue::fake();

        $this->getJson('/api/v1/catalog/search?q=sofa&type=products')
            ->assertOk();

        Queue::assertPushed(RecordSearchQueryAnalyticsJob::class, function (RecordSearchQueryAnalyticsJob $job): bool {
            return $job->query === 'sofa'
                && $job->searchType === 'products'
                && $job->resultCount >= 0;
        });

        $this->assertSame(0, SearchQueryEvent::query()->count());
    }
}
