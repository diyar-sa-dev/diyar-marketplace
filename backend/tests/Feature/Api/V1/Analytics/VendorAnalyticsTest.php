<?php

namespace Tests\Feature\Api\V1\Analytics;

use App\Enums\RoleName;
use App\Services\Analytics\AnalyticsCache;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\AssertsQueryCount;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class VendorAnalyticsTest extends TestCase
{
    use AssertsQueryCount;
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
    public function vendor_analytics_overview_is_scoped_to_authenticated_vendor(): void
    {
        $this->fakePaymentGateway();

        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        [, $orderA] = $this->createPayableOrderForVendor($vendorA);
        app(PaymentFinalizationService::class)->finalizePaid(
            $orderA->payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $responseA = $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendorA)
            ->assertOk()
            ->json('data.analytics.kpis.gross_sales.value');

        $responseB = $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendorB)
            ->assertOk()
            ->json('data.analytics.kpis.gross_sales.value');

        $this->assertNotSame('0.00', $responseA);
        $this->assertSame('0.00', $responseB);
    }

    #[Test]
    public function vendor_cannot_access_another_vendor_data_via_vendor_id_parameter(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendorA)
            ->assertOk();

        $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendorB)
            ->assertOk()
            ->assertJsonPath('data.analytics.kpis.gross_sales.value', '0.00');
    }

    #[Test]
    public function vendor_analytics_overview_respects_query_budget(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $this->assertQueryCountAtMost(function () use ($vendor) {
            $this->getJsonAsUser('/api/v1/dashboard/vendor/analytics/overview?period=30d', $vendor)->assertOk();
        }, 12);
    }

    #[Test]
    public function analytics_cache_keys_are_tenant_scoped(): void
    {
        $cache = app(AnalyticsCache::class);
        $from = now()->subDays(7);
        $to = now();

        $keyA = $cache->key('vendor', 'vendor-a', 'overview', $from, $to, ['preset' => '7d']);
        $keyB = $cache->key('vendor', 'vendor-b', 'overview', $from, $to, ['preset' => '7d']);

        $this->assertNotSame($keyA, $keyB);

        Cache::put($keyA, ['secret' => 'vendor-a'], 60);
        $this->assertNull(Cache::get($keyB));
    }
}
