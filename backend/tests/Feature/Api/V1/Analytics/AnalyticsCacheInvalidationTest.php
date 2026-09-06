<?php

namespace Tests\Feature\Api\V1\Analytics;

use App\Enums\RoleName;
use App\Services\Analytics\AnalyticsCache;
use App\Services\Analytics\AnalyticsCacheInvalidator;
use App\Services\Payments\PaymentFinalizationService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class AnalyticsCacheInvalidationTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithFinance;
    use InteractsWithIdentity;
    use InteractsWithPayments;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
    }

    #[Test]
    public function scope_invalidation_bumps_cache_version(): void
    {
        $cache = app(AnalyticsCache::class);
        $from = CarbonImmutable::now()->subDays(7);
        $to = CarbonImmutable::now();

        Cache::put($cache->key('vendor', 'vendor-a', 'overview', $from, $to, ['preset' => '7d', '_v' => 0]), 'stale', 60);

        app(AnalyticsCacheInvalidator::class)->invalidateVendor('vendor-a');

        $this->assertSame(1, (int) Cache::get('analytics:version:vendor:vendor-a'));

        $result = $cache->remember(
            'vendor',
            'vendor-a',
            'overview',
            $from,
            $to,
            ['preset' => '7d'],
            60,
            fn () => 'fresh',
        );

        $this->assertSame('fresh', $result);
    }

    #[Test]
    public function vendor_analytics_overview_changes_after_payment_finalization(): void
    {
        $this->fakePaymentGateway();

        $vendor = $this->createUserWithRole(RoleName::Vendor);
        [, $order] = $this->createPayableOrderForVendor($vendor);

        $before = $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendor)
            ->assertOk()
            ->json('data.analytics.kpis.gross_sales.value');

        app(PaymentFinalizationService::class)->finalizePaid(
            $order->payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $after = $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendor)
            ->assertOk()
            ->json('data.analytics.kpis.gross_sales.value');

        $this->assertSame('0.00', $before);
        $this->assertNotSame('0.00', $after);
    }
}
