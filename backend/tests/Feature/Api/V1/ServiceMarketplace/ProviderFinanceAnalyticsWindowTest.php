<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Enums\ServiceBookingMode;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingSource;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServicePricingMode;
use App\Enums\ServiceRequestStatus;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProviderFinanceAnalyticsWindowTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function finance_kpis_include_completed_bookings_from_the_last_30_days(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-01 10:00:00'));

        $providerUser = $this->createUserWithRole(RoleName::Provider);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $provider = $providerUser->providerAccount()->firstOrFail();

        $this->createCompletedBooking($provider->id, $customer->id, 'SBK-20260830-0003', '1200.00', '2026-08-30 14:40:00');
        $this->createCompletedBooking($provider->id, $customer->id, 'SBK-20260830-0002', '1500.00', '2026-08-30 14:23:00');

        $summary = $this->getJsonAsUser('/api/v1/dashboard/provider/finance/summary', $providerUser)
            ->assertOk()
            ->json('data.summary');

        $this->assertEquals(2430.0, $summary['available_balance']);
        $this->assertEquals(2700.0, $summary['monthly_gross_earnings']);
        $this->assertEquals(270.0, $summary['monthly_commission']);
        $this->assertEquals(2430.0, $summary['monthly_net_earnings']);

        $analytics = $this->getJsonAsUser('/api/v1/dashboard/provider/finance/analytics', $providerUser)
            ->assertOk()
            ->json('data.analytics');

        $this->assertNotEmpty($analytics);
        $peak = collect($analytics)->firstWhere('date', '2026-08-30');
        $this->assertNotNull($peak);
        $this->assertEquals(2430.0, $peak['net']);

        $today = $this->getJsonAsUser('/api/v1/dashboard/provider/finance/summary?period=day', $providerUser)
            ->assertOk()
            ->json('data.summary');

        $this->assertEquals(2430.0, $today['available_balance']);
        $this->assertEquals(0.0, $today['monthly_gross_earnings']);
    }

    #[Test]
    public function provider_analytics_services_does_not_fail_for_grouped_bookings(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-01 10:00:00'));

        $providerUser = $this->createUserWithRole(RoleName::Provider);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $provider = $providerUser->providerAccount()->firstOrFail();

        $category = ServiceCategory::query()->create([
            'name_ar' => 'ستائر',
            'name_en' => 'Curtains',
            'slug' => 'curtains-finance-test',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $service = Service::query()->create([
            'provider_account_id' => $provider->id,
            'service_category_id' => $category->id,
            'title' => 'تركيب ستائر',
            'slug' => 'curtain-install-finance-test',
            'pricing_mode' => ServicePricingMode::Fixed,
            'booking_mode' => ServiceBookingMode::Direct,
            'starting_price' => 1200,
            'currency' => 'SAR',
            'is_active' => true,
        ]);

        $this->createCompletedBooking(
            $provider->id,
            $customer->id,
            'SBK-20260830-0003',
            '1200.00',
            '2026-08-30 14:40:00',
            $service->id,
            $service->title,
        );

        $this->getJsonAsUser('/api/v1/dashboard/provider/analytics/services?period=30d&page=1', $providerUser)
            ->assertOk()
            ->assertJsonPath('data.services.0.service_title', 'تركيب ستائر')
            ->assertJsonPath('data.services.0.revenue', '1200.00');
    }

    #[Test]
    public function provider_analytics_names_rfq_bookings_and_fills_the_selected_period(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-01 10:00:00'));

        $providerUser = $this->createUserWithRole(RoleName::Provider);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $provider = $providerUser->providerAccount()->firstOrFail();

        $category = ServiceCategory::query()->create([
            'name_ar' => 'أثاث',
            'name_en' => 'Furniture',
            'slug' => 'furniture-analytics-test',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $service = Service::query()->create([
            'provider_account_id' => $provider->id,
            'service_category_id' => $category->id,
            'title' => 'استشارة عن الأثاث',
            'slug' => 'furniture-consult-analytics-test',
            'pricing_mode' => ServicePricingMode::Fixed,
            'booking_mode' => ServiceBookingMode::Direct,
            'starting_price' => 1500,
            'currency' => 'SAR',
            'is_active' => true,
        ]);

        $request = ServiceRequest::query()->create([
            'user_id' => $customer->id,
            'provider_account_id' => $provider->id,
            'reference' => 'SRQ-20260830-0001',
            'title' => 'طلب تنفيذ أثاث مخصص',
            'description' => 'أحتاج تنفيذ أثاث مخصص لغرفة المعيشة.',
            'status' => ServiceRequestStatus::Completed,
        ]);

        $this->createCompletedBooking(
            $provider->id,
            $customer->id,
            'SBK-20260830-0002',
            '1500.00',
            '2026-08-30 14:23:00',
            $service->id,
            $service->title,
        );
        $this->createCompletedBooking(
            $provider->id,
            $customer->id,
            'SBK-20260830-0003',
            '1200.00',
            '2026-08-30 14:40:00',
            null,
            null,
            $request->id,
        );

        $services = $this->getJsonAsUser('/api/v1/dashboard/provider/analytics/services?period=30d&page=1', $providerUser)
            ->assertOk()
            ->json('data.services');

        $titles = collect($services)->pluck('service_title');
        $this->assertTrue($titles->contains('استشارة عن الأثاث'));
        $this->assertTrue($titles->contains('طلب تنفيذ أثاث مخصص'));
        $this->assertFalse($titles->contains(''));
        $this->assertFalse($titles->contains(null));

        $series = $this->getJsonAsUser('/api/v1/dashboard/provider/analytics/bookings?period=30d', $providerUser)
            ->assertOk()
            ->json('data.analytics.series');

        $this->assertCount(30, $series);
        $this->assertSame('2026-08-03', $series[0]['label']);
        $this->assertSame('2026-09-01', $series[29]['label']);
        $this->assertSame('0.00', $series[0]['revenue']);

        $peak = collect($series)->firstWhere('label', '2026-08-30');
        $this->assertNotNull($peak);
        $this->assertSame('2700.00', $peak['revenue']);
    }

    private function createCompletedBooking(
        string $providerAccountId,
        string $customerId,
        string $reference,
        string $price,
        string $completedAt,
        ?string $serviceId = null,
        ?string $serviceTitle = null,
        ?string $serviceRequestId = null,
    ): ServiceBooking {
        $at = CarbonImmutable::parse($completedAt);

        $booking = ServiceBooking::query()->create([
            'user_id' => $customerId,
            'provider_account_id' => $providerAccountId,
            'service_id' => $serviceId,
            'service_request_id' => $serviceRequestId,
            'service_title_snapshot' => $serviceTitle,
            'reference' => $reference,
            'status' => ServiceBookingStatus::Completed,
            'payment_status' => ServiceBookingPaymentStatus::Paid,
            'booking_source' => $serviceRequestId
                ? ServiceBookingSource::Rfq
                : ServiceBookingSource::Direct,
            'price' => $price,
            'currency' => 'SAR',
            'completed_at' => $at,
        ]);

        $booking->forceFill([
            'created_at' => $at,
            'updated_at' => $at,
        ])->save();

        return $booking;
    }

    #[Test]
    public function finance_export_uses_localized_csv_headers(): void
    {
        $providerUser = $this->createUserWithRole(RoleName::Provider);

        $this->app['auth']->forgetGuards();
        \Laravel\Sanctum\Sanctum::actingAs($providerUser);

        $csv = $this->withHeaders(['Accept-Language' => 'ar'])
            ->get('/api/v1/dashboard/provider/finance/export')
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString('المؤشر', $csv);
        $this->assertStringContainsString('الرصيد المتاح', $csv);
        $this->assertStringNotContainsString('Available Balance', $csv);
    }
}
