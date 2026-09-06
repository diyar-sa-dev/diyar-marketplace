<?php

namespace Tests\Feature\Api\V1\ServiceMarketplace;

use App\Enums\RoleName;
use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingStatus;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ServiceMarketplaceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProviderReviewAndDirectBookingTest extends TestCase
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
    public function customer_can_create_direct_booking_for_fixed_service(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(3),
            'scheduled_time' => '10:00',
            'customer_notes' => 'Please call before arrival.',
            'idempotency_key' => 'direct-booking-test-1',
        ])
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::PendingProviderConfirmation->value)
            ->assertJsonPath('data.booking.booking_source', 'direct');
    }

    #[Test]
    public function customer_can_create_direct_booking_for_hourly_consultation_service(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'online-design-consultation')->firstOrFail();

        $this->assertSame('direct', $service->booking_mode->value);
        $this->assertSame(60, $service->duration_minutes);

        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(4),
            'scheduled_time' => '11:00',
            'customer_notes' => 'Online session please.',
            'idempotency_key' => 'hourly-consultation-booking',
        ])
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::PendingProviderConfirmation->value)
            ->assertJsonPath('data.booking.price', '300.00')
            ->assertJsonPath('data.booking.duration_minutes', 60);
    }

    #[Test]
    public function provider_bookings_include_linked_service_details(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(5),
            'scheduled_time' => '10:00',
            'customer_notes' => 'nothing',
            'idempotency_key' => 'service-details-booking',
        ])->assertOk();

        Sanctum::actingAs($providerUser);
        $this->getJson('/api/v1/dashboard/provider/bookings')
            ->assertOk()
            ->assertJsonPath('data.items.0.service.title', $service->title)
            ->assertJsonPath('data.items.0.customer_notes', 'nothing')
            ->assertJsonStructure([
                'data' => [
                    'items' => [[
                        'service' => [
                            'description',
                            'duration_label',
                            'service_type_label',
                            'pricing_label',
                            'category' => ['slug', 'name'],
                        ],
                    ]],
                ],
            ]);
    }

    #[Test]
    public function direct_booking_is_idempotent(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);

        $payload = [
            'scheduled_date' => $this->openBookingDate(3),
            'scheduled_time' => '11:00',
            'idempotency_key' => 'direct-booking-idempotent',
        ];

        $first = $this->postJson("/api/v1/services/{$service->slug}/direct-booking", $payload)->assertOk();
        $second = $this->postJson("/api/v1/services/{$service->slug}/direct-booking", $payload)->assertOk();

        $this->assertSame(
            $first->json('data.booking.id'),
            $second->json('data.booking.id'),
        );
    }

    #[Test]
    public function customer_cannot_create_duplicate_direct_booking_for_same_service(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(3),
            'scheduled_time' => '10:00',
            'idempotency_key' => 'duplicate-booking-block-1',
        ])->assertOk();

        $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => now()->addDays(2)->toDateString(),
            'scheduled_time' => '11:00',
            'idempotency_key' => 'duplicate-booking-block-2',
        ])
            ->assertStatus(409);
    }

    #[Test]
    public function service_detail_includes_user_active_booking_when_authenticated(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(4),
            'scheduled_time' => '14:00',
            'idempotency_key' => 'detail-active-booking',
        ])->assertOk();

        $this->getJson("/api/v1/services/{$service->slug}")
            ->assertOk()
            ->assertJsonPath('data.service.user_active_booking.status', ServiceBookingStatus::PendingProviderConfirmation->value)
            ->assertJsonStructure([
                'data' => [
                    'service' => [
                        'user_active_booking' => [
                            'id',
                            'reference',
                            'status',
                            'scheduled_date',
                            'scheduled_time',
                            'price',
                            'currency',
                        ],
                    ],
                ],
            ]);
    }

    #[Test]
    public function customer_can_review_completed_paid_booking(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(3),
            'scheduled_time' => '12:00',
            'idempotency_key' => 'review-flow-booking',
        ])->json('data.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/confirm")->assertOk();

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", [
            'outcome' => 'paid',
        ])->assertOk();

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/start")->assertOk();
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/complete")->assertOk();

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/review", [
            'rating' => 5,
            'comment' => 'Excellent professional service.',
        ])
            ->assertOk()
            ->assertJsonPath('data.review.rating', 5);

        $provider = $service->providerAccount()->firstOrFail();
        $this->getJson("/api/v1/providers/{$provider->slug}/reviews")
            ->assertOk()
            ->assertJsonPath('data.summary.review_count', 1)
            ->assertJsonPath('data.pagination.total', 1);
    }

    #[Test]
    public function duplicate_review_is_rejected(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $booking = $this->createCompletedDirectBooking($customer);

        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/service-bookings/{$booking->id}/review", [
            'rating' => 4,
            'comment' => 'Good service.',
        ])->assertOk();

        $this->postJson("/api/v1/service-bookings/{$booking->id}/review", [
            'rating' => 5,
            'comment' => 'Trying again.',
        ])->assertStatus(409);
    }

    #[Test]
    public function provider_can_respond_to_review(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $booking = $this->createCompletedDirectBooking($customer);

        Sanctum::actingAs($customer);
        $reviewId = $this->postJson("/api/v1/service-bookings/{$booking->id}/review", [
            'rating' => 5,
            'comment' => 'Great work.',
        ])->json('data.review.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/provider-reviews/{$reviewId}/response", [
            'response' => 'Thank you for your trust.',
        ])
            ->assertOk()
            ->assertJsonPath('data.review.provider_response', 'Thank you for your trust.');
    }

    #[Test]
    public function provider_propose_schedule_past_date_returns_localized_arabic_error(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(5),
            'scheduled_time' => '10:00',
            'idempotency_key' => 'propose-schedule-past-date',
        ])->json('data.booking.id');

        Sanctum::actingAs($providerUser);
        $this->withHeaders(['Accept-Language' => 'ar'])
            ->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/propose-schedule", [
                'proposed_scheduled_date' => '2001-08-12',
                'proposed_scheduled_time' => '10:00',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['proposed_scheduled_date'])
            ->assertJsonFragment([
                'proposed_scheduled_date' => ['يجب أن يكون تاريخ الموعد المقترح اليوم أو بعده.'],
            ]);
    }

    #[Test]
    public function provider_propose_schedule_returns_negotiation_fields(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();
        $requestedDate = $this->openBookingDate(5);
        $proposedDate = $this->openBookingDate(12);

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $requestedDate,
            'scheduled_time' => '10:00',
            'idempotency_key' => 'propose-schedule-success',
        ])->json('data.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/propose-schedule", [
            'proposed_scheduled_date' => $proposedDate,
            'proposed_scheduled_time' => '10:00',
            'provider_notes' => 'Does this time work for you?',
        ])
            ->assertOk()
            ->assertJsonPath('data.booking.status', ServiceBookingStatus::PendingCustomerAcceptance->value)
            ->assertJsonPath('data.booking.proposed_scheduled_date', $proposedDate)
            ->assertJsonPath('data.booking.proposed_scheduled_time', '10:00')
            ->assertJsonPath('data.booking.requested_scheduled_date', $requestedDate)
            ->assertJsonPath('data.booking.last_proposed_scheduled_date', $proposedDate)
            ->assertJsonPath('data.booking.provider_notes', 'Does this time work for you?');
    }

    #[Test]
    public function provider_cannot_review_own_service_booking(): void
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();
        $provider = $service->providerAccount()->firstOrFail();

        $booking = ServiceBooking::query()->create([
            'user_id' => $providerUser->id,
            'provider_account_id' => $provider->id,
            'service_id' => $service->id,
            'reference' => 'BK-SELF-TEST',
            'status' => ServiceBookingStatus::Completed,
            'payment_status' => ServiceBookingPaymentStatus::Paid,
            'price' => $service->price ?? '500.00',
            'currency' => $service->currency,
            'scheduled_date' => now()->subDay()->toDateString(),
            'scheduled_time' => '10:00',
            'booking_source' => 'direct',
        ]);

        Sanctum::actingAs($providerUser);

        $this->postJson("/api/v1/service-bookings/{$booking->id}/review", [
            'rating' => 5,
            'comment' => 'Self review attempt.',
        ])->assertForbidden();
    }

    private function createCompletedDirectBooking(User $customer): ServiceBooking
    {
        $providerUser = User::query()->where('email', 'eiwan@diyar.local')->firstOrFail();
        $service = Service::query()->where('slug', 'office-3d-design')->firstOrFail();

        Sanctum::actingAs($customer);
        $bookingId = $this->postJson("/api/v1/services/{$service->slug}/direct-booking", [
            'scheduled_date' => $this->openBookingDate(4),
            'scheduled_time' => '13:00',
            'idempotency_key' => 'completed-'.uniqid(),
        ])->json('data.booking.id');

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/confirm")->assertOk();

        Sanctum::actingAs($customer);
        $this->postJson("/api/v1/service-bookings/{$bookingId}/payment/simulate", [
            'outcome' => 'paid',
        ])->assertOk();

        Sanctum::actingAs($providerUser);
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/start")->assertOk();
        $this->postJson("/api/v1/dashboard/provider/bookings/{$bookingId}/complete")->assertOk();

        return ServiceBooking::query()->findOrFail($bookingId);
    }

    private function openBookingDate(int $minimumDaysFromNow): string
    {
        $date = Carbon::now()->startOfDay()->addDays($minimumDaysFromNow);

        while (strtolower($date->format('l')) === 'friday') {
            $date->addDay();
        }

        return $date->toDateString();
    }
}
