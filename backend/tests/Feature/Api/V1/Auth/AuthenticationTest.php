<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Enums\RoleName;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        LogSmsProvider::flush();
    }

    public function test_user_can_login_with_phone_and_access_me(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501111111',
            'password' => 'Password123!',
        ]);

        $login = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501111111',
            'password' => 'Password123!',
        ]);

        $login->assertOk()->assertJsonPath('data.user.id', $user->id);

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.phone', '966501111111');
    }

    public function test_user_can_login_with_email(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => 'login@example.com',
            'password' => 'Password123!',
        ])->assertOk()->assertJsonPath('data.user.id', $user->id);
    }

    public function test_invalid_password_is_rejected(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502222222',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502222222',
            'password' => 'WrongPass1',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['credentials']);
    }

    public function test_pending_user_login_requires_phone_verification(): void
    {
        User::factory()->pending()->create([
            'phone' => '966503333333',
            'email' => 'pending@example.com',
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '503333333',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['phone_verification_required', 'verification_phone'])
            ->assertJsonPath('errors.verification_phone.0', '503333333');

        $this->assertNotNull(LogSmsProvider::lastMessage());
        $this->assertGuest('web');
    }

    public function test_pending_user_login_with_email_requires_phone_verification(): void
    {
        User::factory()->pending()->create([
            'phone' => '966504444444',
            'email' => 'pending-email@example.com',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'method' => 'email',
            'identifier' => 'pending-email@example.com',
            'password' => 'Password123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone_verification_required', 'verification_phone'])
            ->assertJsonPath('errors.verification_phone.0', '504444444');

        $this->assertNotNull(LogSmsProvider::lastMessage());
        $this->assertGuest('web');
    }

    public function test_pending_user_can_complete_login_after_otp_verification(): void
    {
        $this->seedRoles();

        User::factory()->pending()->create([
            'phone' => '966505555555',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '505555555',
            'password' => 'Password123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['phone_verification_required']);

        $otp = $this->extractOtpFromLastSms();

        $verify = $this->postStatefulJson('/api/v1/auth/verify-otp', [
            'phone' => '505555555',
            'code' => $otp,
        ]);

        $verify->assertOk()->assertJsonPath('success', true);

        $this->getStatefulJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.phone', '966505555555');
    }

    public function test_unauthenticated_me_returns_401(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_sanctum_requires_spa_origin_for_stateful_requests(): void
    {
        $withoutOrigin = \Illuminate\Http\Request::create('/api/v1/auth/me', 'GET');
        $this->assertFalse(
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::fromFrontend($withoutOrigin),
            'Requests without Origin/Referer must not be treated as stateful (Postman default).',
        );

        $withSpaOrigin = \Illuminate\Http\Request::create('/api/v1/auth/me', 'GET', server: [
            'HTTP_ORIGIN' => 'http://localhost:3000',
        ]);
        $this->assertTrue(
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::fromFrontend($withSpaOrigin),
            'SPA Origin must match SANCTUM_STATEFUL_DOMAINS.',
        );
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966506666666',
            'password' => 'Password123!',
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGuest('web');
    }
}
