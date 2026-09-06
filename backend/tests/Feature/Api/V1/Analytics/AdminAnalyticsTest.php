<?php

namespace Tests\Feature\Api\V1\Analytics;

use App\Enums\RoleName;
use App\Models\SearchQueryEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function admin_search_analytics_requires_permission(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        SearchQueryEvent::query()->create([
            'query' => 'chair',
            'normalized_query' => 'chair',
            'search_type' => 'catalog',
            'result_count' => 3,
            'locale' => 'ar',
            'source' => 'storefront',
            'duration_ms' => 12,
            'created_at' => now(),
        ]);

        $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/analytics/search?period=30d')
            ->assertOk()
            ->assertJsonPath('data.analytics.totals.searches', 1);
    }

    #[Test]
    public function admin_funnel_marks_unavailable_product_views_when_no_events(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/analytics/funnel?period=30d')
            ->assertOk()
            ->json('data.analytics.stages');

        $productViews = collect($response)->firstWhere('key', 'product_views');
        $this->assertFalse($productViews['available']);
        $this->assertSame(0, $productViews['count']);
    }
}
