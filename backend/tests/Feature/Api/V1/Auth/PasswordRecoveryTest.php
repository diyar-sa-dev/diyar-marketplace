<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Enums\RoleName;
use App\Infrastructure\Sms\LogSmsProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PasswordRecoveryTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        LogSmsProvider::flush();
    }

    public function test_forgot_password_sends_otp_for_active_user(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966504444444',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '504444444',
        ])->assertOk();

        $this->assertNotNull(LogSmsProvider::lastMessage());
    }

    public function test_forgot_password_does_not_reveal_missing_account(): void
    {
        $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '509999999',
        ])->assertOk();
    }

    public function test_user_can_reset_password_with_otp(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966505555555',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '505555555',
        ])->assertOk();

        $code = $this->extractOtpFromLastSms();

        $this->postJson('/api/v1/auth/verify-password-reset-otp', [
            'phone' => '505555555',
            'code' => $code,
        ])->assertOk();

        $this->postJson('/api/v1/auth/reset-password', [
            'phone' => '505555555',
            'code' => $code,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '505555555',
            'password' => 'NewPassword123!',
        ])->assertOk();
    }

    public function test_invalid_password_reset_otp_is_rejected_before_reset(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966506666666',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '506666666',
        ])->assertOk();

        $this->postJson('/api/v1/auth/verify-password-reset-otp', [
            'phone' => '506666666',
            'code' => '000000',
        ])->assertUnprocessable()
            ->assertJsonPath('errors.code.0', __('diyar.otp.invalid'));
    }
}
