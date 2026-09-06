<?php

namespace Tests\Feature\Api\V1\Analytics;

use App\Enums\AnalyticsEventType;
use App\Enums\RoleName;
use App\Models\AnalyticsEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AdminAnalyticsFunnelQueryCountTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function admin_funnel_uses_bounded_analytics_event_queries(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);

        foreach ([
            AnalyticsEventType::ProductViewed,
            AnalyticsEventType::AddToCart,
            AnalyticsEventType::CheckoutStarted,
        ] as $type) {
            AnalyticsEvent::query()->create([
                'event_type' => $type->value,
                'payload' => ['seed' => true],
                'created_at' => now(),
            ]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->actingAs($admin, 'admin')
            ->getJson('/api/v1/admin/analytics/funnel?period=30d')
            ->assertOk();

        $analyticsEventSelects = collect(DB::getQueryLog())
            ->filter(fn (array $entry) => str_contains(strtolower($entry['query']), 'analytics_events'))
            ->count();

        DB::disableQueryLog();

        $this->assertLessThanOrEqual(
            2,
            $analyticsEventSelects,
            'Funnel should use grouped analytics event query, not one query per event type.',
        );
    }
}
