<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Enums\ServiceBookingMode;
use App\Enums\ServicePricingMode;
use App\Models\ProviderAccount;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProviderSelfInteractionTest extends TestCase
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
    public function provider_cannot_create_rfq_on_own_service(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'integrated-apartment-design')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($providerUser);

        $this->postJson('/api/v1/service-requests', [
            'description' => 'أحتاج تصميم داخلي لشقة.',
            'category_ids' => [$category->id],
            'service_id' => $service->id,
        ])->assertForbidden()
            ->assertJsonPath('message', __('diyar.services.requests.cannot_request_own_service'));
    }

    #[Test]
    public function provider_cannot_preview_direct_booking_for_own_service(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()
            ->where('slug', 'online-design-consultation')
            ->where('booking_mode', ServiceBookingMode::Direct)
            ->firstOrFail();

        Sanctum::actingAs($providerUser);

        $this->postJson('/api/v1/services/'.$service->slug.'/booking-preview', [
            'scheduled_date' => now()->addDay()->toDateString(),
            'scheduled_time' => '10:00',
        ])->assertForbidden()
            ->assertJsonPath('message', __('diyar.services.bookings.cannot_book_own_service'));
    }

    #[Test]
    public function provider_cannot_book_own_service(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()
            ->where('slug', 'online-design-consultation')
            ->where('booking_mode', ServiceBookingMode::Direct)
            ->firstOrFail();

        Sanctum::actingAs($providerUser);

        $this->postJson('/api/v1/services/'.$service->slug.'/direct-booking', [
            'scheduled_date' => now()->addDay()->toDateString(),
            'scheduled_time' => '10:00',
        ])->assertForbidden()
            ->assertJsonPath('message', __('diyar.services.bookings.cannot_book_own_service'));
    }

    #[Test]
    public function provider_cannot_offer_on_own_rfq(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($providerUser);

        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم داخلي من المزود نفسه.',
            'category_ids' => [$category->id],
        ])->assertCreated()->json('data.service_request.id');

        $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 1500,
            'message' => 'عرض على طلبي.',
        ])->assertForbidden()
            ->assertJsonPath('message', __('diyar.services.offers.cannot_offer_own_request'));
    }

    #[Test]
    public function dual_role_provider_can_book_other_providers_service(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $otherProvider = $this->createUserWithRole(RoleName::Provider, [
            'email' => 'other-provider@test.local',
            'phone' => '966509999999',
        ]);
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        $otherProviderAccount = ProviderAccount::query()
            ->where('user_id', $otherProvider->id)
            ->firstOrFail();

        $otherService = Service::query()->create([
            'provider_account_id' => $otherProviderAccount->id,
            'service_category_id' => $category->id,
            'title' => 'Other provider consultation',
            'slug' => 'other-provider-consultation',
            'description' => 'Consultation service',
            'pricing_mode' => ServicePricingMode::Hourly,
            'booking_mode' => ServiceBookingMode::Direct,
            'starting_price' => 250,
            'currency' => 'SAR',
            'duration_minutes' => 60,
            'is_active' => true,
        ]);

        Sanctum::actingAs($providerUser);

        $this->postJson('/api/v1/services/'.$otherService->slug.'/booking-preview', [
            'scheduled_date' => now()->addDays(2)->toDateString(),
            'scheduled_time' => '11:00',
        ])->assertOk();
    }

    #[Test]
    public function provider_inbox_excludes_own_rfqs_in_sql(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($providerUser);

        $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب RFQ خاص بالمزود نفسه.',
            'category_ids' => [$category->id],
        ])->assertCreated();

        $this->getJson('/api/v1/dashboard/provider/service-requests?status=open')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 0);
    }

    #[Test]
    public function customer_can_create_rfq_on_other_providers_service(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'integrated-apartment-design')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);

        $this->postJson('/api/v1/service-requests', [
            'description' => 'أحتاج تصميم داخلي لشقة.',
            'category_ids' => [$category->id],
            'service_id' => $service->id,
        ])->assertCreated();
    }
}
