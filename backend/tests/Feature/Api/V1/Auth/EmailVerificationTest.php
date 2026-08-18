<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Enums\OtpPurpose;
use App\Enums\RoleName;
use App\Infrastructure\Mail\LogEmailOtpProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function registration_leaves_email_unverified(): void
    {
        $this->postStatefulJson('/api/v1/auth/register', $this->registrationPayload([
            'email' => 'newuser@example.com',
        ]))->assertCreated();

        $user = User::query()->where('email', 'newuser@example.com')->firstOrFail();
        $this->assertNull($user->email_verified_at);
    }

    #[Test]
    public function email_login_requires_otp_when_email_is_unverified(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ]);
        $user->forceFill(['email_verified_at' => null])->save();

        LogEmailOtpProvider::flush();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => 'login@example.com',
            'password' => 'Password123!',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email_verification_required.0', __('diyar.auth.email_verification_required'));

        $this->assertNotNull(LogEmailOtpProvider::lastDevelopmentOtp());
    }

    #[Test]
    public function user_can_verify_email_from_profile(): void
    {
        $user = $this->createUserWithRole(RoleName::Vendor, [
            'email' => 'vendor@example.com',
        ]);
        $user->forceFill(['email_verified_at' => null])->save();

        LogEmailOtpProvider::flush();

        $this->actingAs($user)->postJson('/api/v1/profile/email/request-verification')->assertOk();

        $otp = LogEmailOtpProvider::lastDevelopmentOtp();
        $this->assertNotNull($otp);
        $this->assertSame(OtpPurpose::EmailVerification->value, $otp['purpose']);

        $this->actingAs($user)
            ->postJson('/api/v1/profile/email/verify', ['code' => $otp['otp']])
            ->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    #[Test]
    public function email_login_otp_establishes_session_and_marks_email_verified(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'verifylogin@example.com',
            'password' => 'Password123!',
        ]);
        $user->forceFill(['email_verified_at' => null])->save();

        LogEmailOtpProvider::flush();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => 'verifylogin@example.com',
            'password' => 'Password123!',
        ])->assertUnprocessable();

        $otp = LogEmailOtpProvider::lastDevelopmentOtp();
        $this->assertNotNull($otp);

        $this->postStatefulJson('/api/v1/auth/verify-email-otp', [
            'email' => 'verifylogin@example.com',
            'code' => $otp['otp'],
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email_verified_at', fn ($value) => $value !== null);

        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
    }

    #[Test]
    public function welcome_email_is_skipped_when_email_notifications_are_disabled(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'nowelcome@example.com',
            'email_verified_at' => now(),
            'preferences' => [
                'notifications' => [
                    'email' => false,
                ],
            ],
        ]);

        app(\App\Services\Identity\WelcomeEmailService::class)->sendIfEligible($user);

        $this->assertNull($user->fresh()->welcome_email_sent_at);
    }

    #[Test]
    public function verified_login_sends_welcome_email_when_email_notifications_are_enabled(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'welcome@example.com',
            'password' => 'Password123!',
            'email_verified_at' => now(),
            'preferences' => [
                'notifications' => [
                    'email' => true,
                ],
            ],
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => 'welcome@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $this->assertNotNull($user->fresh()->welcome_email_sent_at);
    }
}
