<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Enums\OtpPurpose;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Models\Role;
use App\Models\User;
use App\Services\Identity\OtpCacheStore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        LogSmsProvider::flush();
        Cache::flush();
        $this->seedRoles();
    }

    public function test_otp_verifications_table_does_not_exist(): void
    {
        $this->assertFalse(Schema::hasTable('otp_verifications'));
    }

    public function test_user_can_register_and_receive_otp_via_log_provider(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->registrationPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.status', UserStatus::Pending->value);

        $this->assertDatabaseHas('users', [
            'phone' => '966501234567',
            'status' => UserStatus::Pending->value,
        ]);

        $this->assertNotNull(LogSmsProvider::lastMessage());
        $this->assertNotNull($this->otpCacheState('966501234567', OtpPurpose::Registration));
        $this->assertDatabaseCount('user_roles', 0);
    }

    public function test_duplicate_phone_is_rejected(): void
    {
        User::factory()->create(['phone' => '966501234567']);

        $this->postJson('/api/v1/auth/register', $this->registrationPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['phone'])
            ->assertJsonPath('errors.phone.0', __('diyar.registration.phone_taken'));
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'taken@example.com',
        ]);

        $this->postJson('/api/v1/auth/register', $this->registrationPayload([
            'email' => 'taken@example.com',
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', __('diyar.registration.email_taken'));
    }

    public function test_admin_role_cannot_be_self_registered(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload([
            'roles' => ['admin'],
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['roles.0']);
    }

    public function test_vendor_account_is_not_created_before_otp_verification(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload([
            'roles' => ['merchant'],
        ]))->assertCreated();

        $user = User::query()->where('phone', '966501234567')->firstOrFail();
        $this->assertNull($user->vendorAccount);
        $this->assertCount(0, $user->roles);
    }

    public function test_registration_verifies_otp_assigns_roles_and_creates_vendor_account(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload([
            'roles' => ['merchant', 'customer'],
        ]))->assertCreated();

        $code = $this->extractOtpFromLastSms();

        $response = $this->postStatefulJson('/api/v1/auth/verify-otp', [
            'phone' => '501234567',
            'code' => $code,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.status', UserStatus::Active->value);

        $user = User::query()->where('phone', '966501234567')->firstOrFail();
        $this->assertNotNull($user->vendorAccount);
        $this->assertTrue($user->hasRole(RoleName::Vendor->value));
        $this->assertTrue($user->hasRole(RoleName::Customer->value));
        $this->assertNull($this->otpCacheState('966501234567', OtpPurpose::Registration));

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_invalid_otp_increments_attempts_in_cache(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload());

        $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '501234567',
            'code' => '000000',
        ])->assertUnprocessable();

        $state = $this->otpCacheState('966501234567', OtpPurpose::Registration);
        $this->assertSame(1, $state['attempts'] ?? null);
    }

    public function test_expired_otp_is_rejected(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload());

        Cache::forget(app(OtpCacheStore::class)->key('966501234567', OtpPurpose::Registration));

        $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '501234567',
            'code' => '123456',
        ])->assertUnprocessable();
    }

    public function test_otp_cannot_be_reused(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload());
        $code = $this->extractOtpFromLastSms();

        $this->postStatefulJson('/api/v1/auth/verify-otp', [
            'phone' => '501234567',
            'code' => $code,
        ])->assertOk();

        $this->postJson('/api/v1/auth/verify-otp', [
            'phone' => '501234567',
            'code' => $code,
        ])->assertUnprocessable();
    }

    public function test_verify_otp_succeeds_when_pending_user_already_has_roles(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registrationPayload([
            'roles' => ['customer'],
        ]))->assertCreated();

        $user = User::query()->where('phone', '966501234567')->firstOrFail();
        $customerRole = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();
        $user->roles()->attach($customerRole->id, [
            'id' => (string) str()->uuid(),
            'status' => 'active',
        ]);

        $code = $this->extractOtpFromLastSms();

        $this->postStatefulJson('/api/v1/auth/verify-otp', [
            'phone' => '501234567',
            'code' => $code,
        ])->assertOk()
            ->assertJsonPath('data.user.status', UserStatus::Active->value);

        $this->assertSame(1, $user->fresh('roles')->roles()->count());
    }

    public function test_otp_resend_limit_is_enforced(): void
    {
        config(['diyar.otp.max_resends_per_hour' => 1, 'diyar.otp.resend_cooldown_seconds' => 0]);

        $this->postJson('/api/v1/auth/register', $this->registrationPayload());

        $this->postJson('/api/v1/auth/resend-otp', ['phone' => '501234567'])->assertOk();

        $this->postJson('/api/v1/auth/resend-otp', ['phone' => '501234567'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['phone']);
    }
}
