<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\RoleName;
use App\Models\User;
use App\Models\UserSession;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class UserSessionSecurityTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function extractCookieValue(TestResponse $response, string $name): ?string
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie->getValue();
            }
        }

        return null;
    }

    /**
     * @return array{name: string, value: string}|null
     */
    private function extractRememberCookie(TestResponse $response): ?array
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if (str_starts_with($cookie->getName(), 'remember_web_')) {
                return [
                    'name' => $cookie->getName(),
                    'value' => $cookie->getValue(),
                ];
            }
        }

        return null;
    }

    #[Test]
    public function login_registers_exactly_one_active_session(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010101',
            'password' => 'Password123!',
        ]);

        $this->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0')
            ->postStatefulJson('/api/v1/auth/login', [
                'method' => 'phone',
                'identifier' => '501010101',
                'password' => 'Password123!',
            ])->assertOk()->assertJsonPath('data.user.id', $user->id);

        $this->assertSame(1, UserSession::query()->where('user_id', $user->id)->whereNull('revoked_at')->count());
        $this->assertDatabaseHas('user_sessions', [
            'user_id' => $user->id,
            'browser' => 'Chrome',
            'platform' => 'Windows',
            'revoked_at' => null,
        ]);
    }

    #[Test]
    public function repeated_authenticated_requests_do_not_duplicate_session_rows(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501010102',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501010102',
            'password' => 'Password123!',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
        $this->getStatefulJson('/api/v1/profile/security/sessions')->assertOk();

        $this->assertSame(1, UserSession::query()->whereNull('revoked_at')->count());
    }

    #[Test]
    public function user_can_list_and_revoke_other_sessions(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501020202',
            'password' => 'Password123!',
        ]);

        $loginA = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501020202',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionA = UserSession::query()->where('user_id', $user->id)->firstOrFail();
        $sessionCookieName = config('session.cookie');
        $sessionIdB = $this->extractCookieValue($loginA, $sessionCookieName);

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501020202',
            'password' => 'Password123!',
        ])->assertOk();

        $list = $this->getStatefulJson('/api/v1/profile/security/sessions')
            ->assertOk()
            ->assertJsonCount(2, 'data.sessions');

        $current = collect($list->json('data.sessions'))->firstWhere('is_current', true);
        $other = collect($list->json('data.sessions'))->firstWhere('is_current', false);

        $this->assertNotNull($current);
        $this->assertNotNull($other);
        $this->assertArrayNotHasKey('laravel_session_id', $other);
        $this->assertArrayNotHasKey('session_lookup_hash', $other);

        $this->deleteStatefulJson('/api/v1/profile/security/sessions/'.$other['id'])
            ->assertOk();

        $this->getStatefulJson('/api/v1/profile/security/sessions')
            ->assertOk()
            ->assertJsonCount(1, 'data.sessions');

        $this->assertNotNull(UserSession::query()->find($sessionA->id)?->revoked_at);

        $this->assertRevokedSessionCannotAuthenticate($sessionCookieName, (string) $sessionIdB);
    }

    #[Test]
    public function revoked_session_cannot_access_protected_api(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501020203',
            'password' => 'Password123!',
        ]);

        $loginA = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501020203',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionCookieName = config('session.cookie');
        $sessionCookieA = $this->extractCookieValue($loginA, $sessionCookieName);

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501020203',
            'password' => 'Password123!',
        ])->assertOk();

        $other = collect($this->getStatefulJson('/api/v1/profile/security/sessions')->json('data.sessions'))
            ->firstWhere('is_current', false);

        $this->deleteStatefulJson('/api/v1/profile/security/sessions/'.$other['id'])
            ->assertOk();

        $this->assertRevokedSessionCannotAuthenticate($sessionCookieName, (string) $sessionCookieA);
    }

    #[Test]
    public function user_cannot_revoke_current_session_via_api(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501030303',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501030303',
            'password' => 'Password123!',
        ])->assertOk();

        $current = UserSession::query()->whereNull('revoked_at')->firstOrFail();

        $this->deleteStatefulJson('/api/v1/profile/security/sessions/'.$current->id)
            ->assertForbidden();
    }

    #[Test]
    public function user_cannot_revoke_another_users_session(): void
    {
        $userA = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501030401',
            'password' => 'Password123!',
        ]);
        $userB = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501030402',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501030401',
            'password' => 'Password123!',
        ])->assertOk();

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501030402',
            'password' => 'Password123!',
        ])->assertOk();

        $victimSession = UserSession::query()->where('user_id', $userA->id)->firstOrFail();

        $this->deleteStatefulJson('/api/v1/profile/security/sessions/'.$victimSession->id)
            ->assertNotFound();

        $this->assertNull(UserSession::query()->find($victimSession->id)?->revoked_at);
        $this->assertSame($userB->id, UserSession::query()->where('user_id', $userB->id)->value('user_id'));
    }

    #[Test]
    public function logout_others_preserves_current_session_authentication(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501040404',
            'password' => 'Password123!',
        ]);

        $loginA = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501040404',
            'password' => 'Password123!',
        ])->assertOk();

        $otherSession = UserSession::query()->where('user_id', $user->id)->firstOrFail();
        $sessionCookieName = config('session.cookie');
        $sessionCookieA = $this->extractCookieValue($loginA, $sessionCookieName);

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501040404',
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/profile/security/sessions/logout-others')
            ->assertOk()
            ->assertJsonPath('data.revoked_count', 1);

        $this->assertNotNull(UserSession::query()->find($otherSession->id)?->revoked_at);
        $this->getStatefulJson('/api/v1/profile/security/sessions')
            ->assertOk()
            ->assertJsonCount(1, 'data.sessions');

        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
        $this->assertRevokedSessionCannotAuthenticate($sessionCookieName, (string) $sessionCookieA);
    }

    #[Test]
    public function password_reset_revokes_all_sessions(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050505',
            'password' => 'Password123!',
        ]);

        $login = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050505',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionId = UserSession::query()->where('user_id', $user->id)->value('id');
        $sessionCookieName = config('session.cookie');
        $sessionCookie = $this->extractCookieValue($login, $sessionCookieName);

        $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '501050505',
        ])->assertOk();

        $otp = $this->extractOtpFromLastSms();

        $this->postJson('/api/v1/auth/reset-password', [
            'phone' => '501050505',
            'code' => $otp,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertNotNull(UserSession::query()->find($sessionId)?->revoked_at);
        $this->assertRevokedSessionCannotAuthenticate($sessionCookieName, (string) $sessionCookie);
    }

    #[Test]
    public function password_change_revokes_other_sessions_but_keeps_current(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050506',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050506',
            'password' => 'Password123!',
        ])->assertOk();

        $otherSession = UserSession::query()->where('user_id', $user->id)->firstOrFail();

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050506',
            'password' => 'Password123!',
        ])->assertOk();

        $currentLaravelSession = UserSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->where('id', '!=', $otherSession->id)
            ->firstOrFail();

        $this->patchStatefulJson('/api/v1/profile/password', [
            'current_password' => 'Password123!',
            'new_password' => 'NewPassword123!',
            'new_password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertNotNull(UserSession::query()->find($otherSession->id)?->revoked_at);
        $this->assertNull(UserSession::query()->find($currentLaravelSession->id)?->revoked_at);
        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
    }

    #[Test]
    public function session_regeneration_updates_registry_to_new_session_id(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050507',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050507',
            'password' => 'Password123!',
        ])->assertOk();

        $before = UserSession::query()->where('user_id', $user->id)->firstOrFail();
        $oldHash = $before->session_lookup_hash;

        $this->patchStatefulJson('/api/v1/profile/password', [
            'current_password' => 'Password123!',
            'new_password' => 'NewPassword123!',
            'new_password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $after = UserSession::query()->findOrFail($before->id);
        $this->assertNotSame($oldHash, $after->session_lookup_hash);
        $this->assertNull($after->revoked_at);
    }

    #[Test]
    public function logout_others_clears_remember_token_for_persistent_auth_invalidation(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050508',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050508',
            'password' => 'Password123!',
            'remember' => true,
        ])->assertOk();

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050508',
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/profile/security/sessions/logout-others')
            ->assertOk()
            ->assertJsonPath('data.revoked_count', 1);

        $this->assertNull($user->fresh()->remember_token);
        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
    }

    #[Test]
    public function activity_tracking_is_non_critical_when_cache_fails(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050509',
            'password' => 'Password123!',
        ]);

        Cache::shouldReceive('add')->andThrow(new \RuntimeException('cache unavailable'));

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501050509',
            'password' => 'Password123!',
        ])->assertOk();

        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
    }

    #[Test]
    public function trusted_geo_headers_are_ignored_by_default(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050510',
            'password' => 'Password123!',
        ]);

        $this->withHeader('CF-IPCountry', 'US')
            ->postStatefulJson('/api/v1/auth/login', [
                'method' => 'phone',
                'identifier' => '501050510',
                'password' => 'Password123!',
            ])->assertOk();

        $session = UserSession::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertNull($session->country);
    }

    #[Test]
    public function trusted_geo_headers_apply_only_when_configured(): void
    {
        config(['diyar.security.trust_geo_proxy_headers' => true]);

        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501050511',
            'password' => 'Password123!',
        ]);

        $this->withHeader('CF-IPCountry', 'SA')
            ->withHeader('CF-IPCity', 'Riyadh')
            ->postStatefulJson('/api/v1/auth/login', [
                'method' => 'phone',
                'identifier' => '501050511',
                'password' => 'Password123!',
            ])->assertOk();

        $session = UserSession::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('SA', $session->country);
        $this->assertSame('Riyadh', $session->city);
        $this->assertSame('proxy_header', $session->location_source);
    }

    private function assertRevokedSessionCannotAuthenticate(string $sessionCookieName, string $sessionCookieValue): void
    {
        $this->app['auth']->forgetGuards();
        $this->resetStatefulSession();

        $this->withUnencryptedCookie($sessionCookieName, $sessionCookieValue)
            ->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }
}
