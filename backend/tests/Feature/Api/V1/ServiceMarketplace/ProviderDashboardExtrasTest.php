<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProviderDashboardExtrasTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(ServiceMarketplaceSeeder::class);
    }

    #[Test]
    public function provider_can_manage_settings_services_and_finance(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        Sanctum::actingAs($providerUser);

        $this->getJson('/api/v1/dashboard/provider/settings')
            ->assertOk()
            ->assertJsonPath('data.settings.profile.specialty', 'إيوان للتصميم');

        $this->patchJson('/api/v1/dashboard/provider/settings/profile', [
            'specialty' => 'مصممة ديكور داخلي',
            'bio' => 'خبرة 5 سنوات',
            'work_areas' => 'الرياض، الخرج',
        ])->assertOk()
            ->assertJsonPath('data.settings.profile.specialty', 'مصممة ديكور داخلي');

        $this->patchJson('/api/v1/dashboard/provider/settings/notifications', [
            'new_reviews' => true,
        ])->assertOk()
            ->assertJsonPath('data.settings.notifications.new_reviews', true);

        $this->putJson('/api/v1/dashboard/provider/settings/work-policy', [
            'policy_enabled' => true,
            'initial_delivery_days' => 7,
            'free_revisions_included' => 2,
            'timeline_by_project_scope' => true,
            'cancellation_notice_hours' => 24,
            'custom_terms' => ['يتطلب دفعة مقدمة 30%'],
        ])->assertOk()
            ->assertJsonPath('data.work_policy.initial_delivery_days', 7);

        $this->getJson('/api/v1/providers/eiwan-design')
            ->assertOk()
            ->assertJsonStructure(['data' => ['provider' => ['work_policy_summary']]]);

        $create = $this->postJson('/api/v1/dashboard/provider/services', [
            'title' => 'استشارة تصميم سريعة',
            'starting_price' => 350,
            'duration_label' => 'ساعتين',
            'location' => 'الرياض',
            'description' => 'جلسة استشارة أونلاين',
            'is_active' => true,
        ])->assertCreated();

        $serviceId = $create->json('data.service.id');

        $movingCategory = ServiceCategory::query()->where('slug', 'moving')->firstOrFail();
        $movingService = $this->postJson('/api/v1/dashboard/provider/services', [
            'title' => 'نقل أثاث منزلي',
            'starting_price' => 500,
            'service_category_id' => $movingCategory->id,
            'service_type_label' => 'نقل أثاث',
        ])->assertCreated();

        $this->assertSame(
            $movingCategory->id,
            $movingService->json('data.service.category.id'),
        );

        $this->getJson('/api/v1/services?category=moving')
            ->assertOk()
            ->assertJsonFragment(['title' => 'نقل أثاث منزلي']);

        $this->patchJson("/api/v1/dashboard/provider/services/{$serviceId}", [
            'starting_price' => 400,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.service.is_active', false);

        $this->getJson('/api/v1/dashboard/provider/finance/summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['summary' => ['available_balance', 'monthly_gross_earnings']]]);

        $this->getJson('/api/v1/dashboard/provider/finance/analytics')
            ->assertOk()
            ->assertJsonStructure(['data' => ['analytics']]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم داخلي لغرفة معيشة.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 1000,
            'message' => 'عرض شامل للتصميم الداخلي.',
        ])->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->json('data.offer.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/confirm")
            ->assertOk();

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", [
            'outcome' => 'paid',
        ])->assertOk();

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/start")->assertOk();
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/complete")->assertOk();

        $this->getJson('/api/v1/dashboard/provider/finance/summary')
            ->assertOk()
            ->assertJsonPath('data.summary.monthly_gross_earnings', 1000);

        $this->patchJson('/api/v1/dashboard/provider/settings/bank-account', [
            'bank_code' => 'snb',
            'beneficiary_name' => 'Eiwan Provider',
            'iban' => 'SA0380000000608010167519',
        ])->assertOk()
            ->assertJsonPath('data.settings.bank_accounts.0.bank_code', 'snb');

        $this->postJson('/api/v1/dashboard/provider/finance/payouts', [
            'amount' => 100,
        ])->assertCreated();

        $this->deleteJson("/api/v1/dashboard/provider/services/{$serviceId}")
            ->assertOk();

        $bookedService = Service::query()
            ->where('provider_account_id', $providerUser->providerAccount->id)
            ->firstOrFail();
        ServiceBooking::query()->whereKey($bookingId)->update(['service_id' => $bookedService->id]);

        $this->deleteJson("/api/v1/dashboard/provider/services/{$bookedService->id}")
            ->assertStatus(422);
    }
}
