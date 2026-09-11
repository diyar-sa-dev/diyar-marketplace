<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Contracts\Sms\SmsProvider;
use App\Enums\RoleName;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        LogSmsProvider::flush();
    }

    public function test_user_without_two_factor_logs_in_normally(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010101',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010101',
            'password' => 'Password123!',
        ])->assertOk()->assertJsonPath('data.user.id', $user->id);
    }

    public function test_login_with_two_factor_requires_challenge(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010102',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $response = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010102',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['two_factor_required']);

        $challengeId = $response->json('errors.challenge_id.0');
        $this->assertNotEmpty($challengeId);

        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '123456',
        ])->assertOk()->assertJsonPath('data.user.id', $user->id);

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_wrong_two_factor_code_keeps_user_unauthenticated(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010103',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $response = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010103',
            'password' => 'Password123!',
        ])->assertUnprocessable();

        $challengeId = $response->json('errors.challenge_id.0');

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '000000',
        ])->assertUnprocessable()->assertJsonValidationErrors(['code']);

        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_two_factor_otp_cannot_be_replayed(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010104',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $challengeId = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010104',
            'password' => 'Password123!',
        ])->json('errors.challenge_id.0');

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '123456',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '123456',
        ])->assertUnprocessable();
    }

    public function test_challenge_is_consumed_after_successful_verification(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010105',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $challengeId = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010105',
            'password' => 'Password123!',
        ])->json('errors.challenge_id.0');

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '123456',
        ])->assertOk();

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '123456',
        ])->assertUnprocessable()->assertJsonValidationErrors(['challenge_id']);
    }

    public function test_user_can_enable_and_disable_two_factor(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010106',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJsonAsUser('/api/v1/profile/security/two-factor/enable', $user)
            ->assertOk();

        $this->postStatefulJsonAsUser('/api/v1/profile/security/two-factor/confirm', $user, [
            'code' => '123456',
        ])->assertOk()
            ->assertJsonPath('data.two_factor.enabled', true);

        $this->postStatefulJsonAsUser('/api/v1/profile/security/two-factor/disable', $user, [
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJsonAsUser('/api/v1/profile/security/two-factor/disable', $user, [
            'password' => 'Password123!',
            'code' => '123456',
        ])->assertOk()
            ->assertJsonPath('data.two_factor.enabled', false);
    }

    public function test_test_otp_is_rejected_when_test_mode_disabled(): void
    {
        config(['diyar.otp.test_mode' => false]);

        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010107',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $challengeId = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010107',
            'password' => 'Password123!',
        ])->json('errors.challenge_id.0');

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => '123456',
        ])->assertUnprocessable()->assertJsonValidationErrors(['code']);
    }

    public function test_password_recovery_then_login_still_requires_two_factor(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010109',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->postJson('/api/v1/auth/forgot-password', ['phone' => '501010109'])->assertOk();
        $code = $this->extractOtpFromLastSms();

        $this->postJson('/api/v1/auth/verify-password-reset-otp', [
            'phone' => '501010109',
            'code' => $code,
        ])->assertOk();

        $this->postJson('/api/v1/auth/reset-password', [
            'phone' => '501010109',
            'code' => $code,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $response = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010109',
            'password' => 'NewPassword123!',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['two_factor_required']);
        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_disable_otp_cannot_confirm_enrollment(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010110',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->postStatefulJsonAsUser('/api/v1/profile/security/two-factor/disable', $user, [
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJsonAsUser('/api/v1/profile/security/two-factor/confirm', $user, [
            'code' => '123456',
        ])->assertUnprocessable()->assertJsonValidationErrors(['code']);

        $user->refresh();
        $this->assertTrue($user->hasTwoFactorEnabled());
    }

    public function test_user_cannot_verify_another_users_challenge(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010111',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010112',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $challengeForFirstUser = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010111',
            'password' => 'Password123!',
        ])->json('errors.challenge_id.0');

        LogSmsProvider::flush();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010112',
            'password' => 'Password123!',
        ])->assertUnprocessable();

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeForFirstUser,
            'code' => '123456',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.phone', '966501010111');
    }

    public function test_new_login_invalidates_previous_challenge(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010113',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $oldChallenge = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010113',
            'password' => 'Password123!',
        ])->json('errors.challenge_id.0');

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010113',
            'password' => 'Password123!',
        ])->assertUnprocessable();

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $oldChallenge,
            'code' => '123456',
        ])->assertUnprocessable()->assertJsonValidationErrors(['challenge_id']);
    }

    public function test_resend_two_factor_issues_fresh_code(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010114',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $challengeId = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010114',
            'password' => 'Password123!',
        ])->json('errors.challenge_id.0');

        config(['diyar.otp.resend_cooldown_seconds' => 0]);

        $this->travel(61)->seconds();

        $this->postStatefulJson('/api/v1/auth/resend-two-factor', [
            'challenge_id' => $challengeId,
        ])->assertOk();

        $code = $this->extractOtpFromLastSms();

        $this->postStatefulJson('/api/v1/auth/verify-two-factor', [
            'challenge_id' => $challengeId,
            'code' => $code,
        ])->assertOk();
    }

    public function test_sms_provider_failure_does_not_authenticate(): void
    {
        $this->mock(SmsProvider::class, function ($mock): void {
            $mock->shouldReceive('send')->andThrow(new \RuntimeException('SMS unavailable'));
        });

        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010115',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010115',
            'password' => 'Password123!',
        ])->assertUnprocessable();

        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_pending_two_factor_cannot_access_profile_routes(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010116',
            'password' => 'Password123!',
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010116',
            'password' => 'Password123!',
        ])->assertUnprocessable();

        $this->getStatefulJson('/api/v1/profile/security/two-factor')->assertUnauthorized();
    }

}
