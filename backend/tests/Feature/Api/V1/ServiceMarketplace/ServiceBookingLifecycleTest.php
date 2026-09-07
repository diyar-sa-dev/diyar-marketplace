<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServiceBookingMode;
use App\Enums\ServiceOfferStatus;
use App\Enums\ServicePricingMode;
use App\Enums\ServiceRequestStatus;
use App\Models\ProviderAccount;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\ServiceCategory;
use App\Models\ServiceOffer;
use App\Models\ServiceRequest;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ServiceBookingLifecycleTest extends TestCase
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
    public function customer_can_cancel_unpaid_booking_at_pending_payment(): void
    {
        $customer = $this->customer();
        ['bookingId' => $bookingId] = $this->createBookingAtPendingPayment($customer);

        Sanctum::actingAs($customer);

        $this->getJson("/api/v1/service-bookings/{$bookingId}")
            ->assertOk()
            ->assertJsonPath('data.booking.can_cancel', true);

        $this->postJson("/api/v1/service-bookings/{$bookingId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::Cancelled->value);
    }

    #[Test]
    public function neither_party_can_cancel_after_payment(): void
    {
        $customer = $this->customer();
        $providerUser = $this->providerUser();
        ['bookingId' => $bookingId] = $this->createBookingAtPendingPayment($customer);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", ['outcome' => 'paid'])
            ->assertOk();

        $this->getJson("/api/v1/service-bookings/{$bookingId}")
            ->assertOk()
            ->assertJsonPath('data.booking.can_cancel', false);

        $this->postJson("/api/v1/service-bookings/{$bookingId}/cancel")
            ->assertStatus(422);

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/cancel")
            ->assertStatus(422);
    }

    #[Test]
    public function provider_cancellation_reopens_rfq_when_other_offers_exist(): void
    {
        $customer = $this->customer();
        $acceptedProvider = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $alternateProvider = User::query()->where('email', 'diyar-design@diyar.local')->firstOrFail();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();
        $this->ensureProviderHasCategoryService(
            ProviderAccount::query()->where('slug', 'diyar-design')->firstOrFail(),
            $category,
        );

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم غرفة معيشة بأسلوب عصري.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($alternateProvider);
        $alternateOfferId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2100,
            'message' => 'عرض بديل يشمل التصميم والتعديلات.',
        ])->assertCreated()->json('data.offer.id');

        Sanctum::actingAs($acceptedProvider);
        $acceptedOfferId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2300,
            'message' => 'عرض أساسي يشمل التصميم والتنفيذ.',
        ])->assertCreated()->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$acceptedOfferId}/accept")
            ->assertOk()
            ->json('data.offer.booking.id');

        Sanctum::actingAs($acceptedProvider);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::Cancelled->value);

        $request = ServiceRequest::query()->findOrFail($requestId);
        $this->assertSame(ServiceRequestStatus::OffersReceived, $request->status);
        $this->assertNull($request->accepted_offer_id);

        $this->assertSame(
            ServiceOfferStatus::Pending,
            ServiceOffer::query()->findOrFail($alternateOfferId)->status,
        );
        $this->assertSame(
            ServiceOfferStatus::Rejected,
            ServiceOffer::query()->findOrFail($acceptedOfferId)->status,
        );
    }

    #[Test]
    public function provider_cancellation_closes_rfq_when_no_other_offers_exist(): void
    {
        $customer = $this->customer();
        $providerUser = $this->providerUser();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم مطبخ صغير.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 1700,
            'message' => 'عرض وحيد يشمل التصميم والمعاينة.',
        ])->assertCreated()->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->assertOk()
            ->json('data.offer.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/cancel")->assertOk();

        $request = ServiceRequest::query()->findOrFail($requestId);
        $this->assertSame(ServiceRequestStatus::Cancelled, $request->status);
        $this->assertNull($request->accepted_offer_id);
    }

    #[Test]
    public function customer_cannot_accept_expired_offer(): void
    {
        $customer = $this->customer();
        $providerUser = $this->providerUser();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم غرفة نوم بأسلوب عصري مع أثاث مريح.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 1600,
            'message' => 'عرض منتهي الصلاحية للاختبار.',
        ])->assertCreated()->json('data.offer.id');

        ServiceOffer::query()->whereKey($offerId)->update([
            'expires_at' => now()->subHour(),
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->assertStatus(422)
            ->assertJsonPath('message', __('diyar.services.offers.expired'));

        $this->assertSame(
            ServiceOfferStatus::Expired,
            ServiceOffer::query()->findOrFail($offerId)->status,
        );
    }

    #[Test]
    public function unpaid_booking_expires_after_payment_window(): void
    {
        $customer = $this->customer();
        ['bookingId' => $bookingId] = $this->createBookingAtPendingPayment($customer);

        ServiceBooking::query()->whereKey($bookingId)->update([
            'payment_due_at' => now()->subMinute(),
        ]);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", ['outcome' => 'paid'])
            ->assertStatus(422)
            ->assertJsonPath('message', __('diyar.services.payments.window_expired'));

        $this->assertSame(
            ServiceBookingStatus::Cancelled,
            ServiceBooking::query()->findOrFail($bookingId)->status,
        );
    }

    #[Test]
    public function payment_failure_keeps_booking_payable_for_retry(): void
    {
        $customer = $this->customer();
        ['bookingId' => $bookingId] = $this->createBookingAtPendingPayment($customer);

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", ['outcome' => 'failed'])
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::PendingPayment->value);

        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", ['outcome' => 'paid'])
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::Confirmed->value)
            ->assertJsonPath('data.booking.payment_status', ServiceBookingPaymentStatus::Paid->value);
    }

    #[Test]
    public function expire_unpaid_bookings_command_cancels_due_bookings(): void
    {
        $customer = $this->customer();
        ['bookingId' => $bookingId] = $this->createBookingAtPendingPayment($customer);

        ServiceBooking::query()->whereKey($bookingId)->update([
            'payment_due_at' => now()->subMinute(),
        ]);

        $this->artisan('service-bookings:expire-unpaid')->assertSuccessful();

        $this->assertSame(
            ServiceBookingStatus::Cancelled,
            ServiceBooking::query()->findOrFail($bookingId)->status,
        );
    }

    /**
     * @return array{bookingId: string, requestId: string}
     */
    private function createBookingAtPendingPayment(User $customer): array
    {
        $providerUser = $this->providerUser();
        $category = ServiceCategory::query()->where('slug', 'interior-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $requestId = $this->postJson('/api/v1/service-requests', [
            'description' => 'طلب تصميم داخلي لغرفة ضيوف.',
            'category_ids' => [$category->id],
        ])->json('data.service_request.id');

        Sanctum::actingAs($providerUser);
        $offerId = $this->postJson("/api/v1/service-requests/{$requestId}/offers", [
            'proposed_price' => 2000,
            'message' => 'يشمل التصميم.',
        ])->assertCreated()->json('data.offer.id');

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/service-offers/{$offerId}/accept")
            ->assertOk()
            ->json('data.offer.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/confirm")->assertOk();

        return [
            'bookingId' => $bookingId,
            'requestId' => $requestId,
        ];
    }

    private function customer(): User
    {
        return $this->createUserWithRole(RoleName::Customer);
    }

    private function providerUser(): User
    {
        return User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
    }

    private function ensureProviderHasCategoryService(ProviderAccount $provider, ServiceCategory $category): void
    {
        if ($provider->services()
            ->where('service_category_id', $category->id)
            ->where('is_active', true)
            ->exists()) {
            return;
        }

        Service::query()->create([
            'provider_account_id' => $provider->id,
            'service_category_id' => $category->id,
            'slug' => 'test-'.$provider->slug.'-'.$category->slug,
            'title' => 'Test service',
            'description' => 'Test service for RFQ coverage.',
            'pricing_mode' => ServicePricingMode::Fixed,
            'booking_mode' => ServiceBookingMode::Request,
            'starting_price' => 1000,
            'currency' => 'SAR',
            'delivery_type_label' => 'Test',
            'location' => 'Riyadh',
            'remote_available' => true,
            'is_active' => true,
        ]);
    }
}
