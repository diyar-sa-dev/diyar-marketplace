<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ServiceRfqWorkflowTest extends TestCase
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
    public function customer_can_create_and_list_service_requests(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/v1/service-requests', [
            'description' => 'أحتاج مصمم داخلي لتصميم صالة جلوس بمساحة 20 متر مربع مع أثاث عصري.',
            'category_ids' => [$category->id],
            'budget_min' => 500,
            'budget_max' => 1500,
            'reference_links' => ['https://example.com/inspiration'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.service_request.status', ServiceRequestStatus::Pending->value)
            ->assertJsonStructure(['data' => ['service_request' => ['id', 'reference', 'categories']]]);

        $this->getJson('/api/v1/service-requests')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1);
    }

    #[Test]
    public function provider_can_submit_offer_and_customer_can_accept_it(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $create = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم داخلي كامل لشقة جديدة بثلاث غرف نوم وصالة.',
            'category_ids' => [$category->id],
        ])->assertCreated();

        $requestId = $create->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offer = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2500,
            'duration_days' => 14,
            'message' => 'يشمل السعر معاينة الموقع وتسليم المخططات.',
        ])->assertCreated();

        $offerId = $offer->json('data.offer.id');

        Sanctum::actingAs($customer);
        $this->getJson("/api/v1/service-requests/{$requestId}")
            ->assertOk()
            ->assertJsonPath('data.service_request.status', ServiceRequestStatus::OffersReceived->value)
            ->assertJsonCount(1, 'data.service_request.offers');

        $accept = $this->postJson("/api/v1/service-offers/{$offerId}/accept", [
            'location' => 'الرياض',
        ])->assertOk();

        $accept->assertJsonPath('data.offer.status', 'accepted')
            ->assertJsonPath('data.offer.booking.status', ServiceBookingStatus::PendingPayment->value);
    }

    #[Test]
    public function customer_can_simulate_booking_payment(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم مطبخ مفتوح مع جزيرة وسطح كوartz.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 1800,
        ])->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->json('data.offer.booking.id');

        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", [
            'outcome' => 'paid',
        ])
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::Confirmed->value)
            ->assertJsonPath('data.booking.payment_status', 'paid');
    }

    #[Test]
    public function provider_can_complete_booking_after_payment(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تركيب جبس بورد لصالة ومدخل منزل.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 3200,
        ])->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->json('data.offer.booking.id');
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", ['outcome' => 'paid']);

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/start")
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::InProgress->value);

        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/complete")
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::Completed->value);

        $this->assertSame(
            ServiceRequestStatus::Completed,
            ServiceRequest::query()->findOrFail($requestId)->status,
        );
    }

    #[Test]
    public function non_provider_roles_cannot_access_provider_dashboard_inbox(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        Sanctum::actingAs($customer);
        $this->getJson('/api/v1/dashboard/provider/service-requests')
            ->assertForbidden();

        Sanctum::actingAs($vendor);
        $this->getJson('/api/v1/dashboard/provider/service-requests')
            ->assertForbidden();
    }

    #[Test]
    public function provider_cannot_submit_duplicate_offer(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم غرفة نوم رئيسية بأسلوب عصري.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2200,
            'message' => 'يشمل التصميم ثلاثي الأبعاد.',
        ])->assertCreated();

        $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2300,
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', __('diyar.services.offers.already_submitted'));
    }

    #[Test]
    public function provider_cannot_start_booking_before_payment(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تركيب مطبخ جاهز مع تعديلات بسيطة.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 1900,
        ])->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->json('data.offer.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/start")
            ->assertStatus(422)
            ->assertJsonPath('message', __('diyar.services.bookings.invalid_transition'));
    }

    #[Test]
    public function provider_cannot_view_request_outside_their_categories(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $maintenanceProvider = User::query()->where('email', 'enjaz@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم داخلي لغرفة معيشة.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($maintenanceProvider);
        $this->getJson("/api/v1/dashboard/provider/service-requests/{$requestId}")
            ->assertForbidden();
    }

    #[Test]
    public function provider_cannot_manage_another_providers_booking(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $ownerProvider = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $otherProvider = User::query()->where('email', 'diyar-design@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم مطبخ مفتوح.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($ownerProvider);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2100,
        ])->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->json('data.offer.booking.id');
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", ['outcome' => 'paid']);

        Sanctum::actingAs($otherProvider);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/complete")
            ->assertForbidden();
    }
}
