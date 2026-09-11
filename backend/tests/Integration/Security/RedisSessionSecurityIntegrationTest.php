<?php

namespace Tests\Integration\Security;

use App\Enums\RoleName;
use App\Models\UserSession;
use App\Support\Security\SessionLookupHash;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

/**
 * Production-runtime gate: Laravel sessions stored in Redis with real handler destroy().
 *
 * Run with Redis reachable, e.g.:
 * REDIS_HOST=127.0.0.1 REDIS_PORT=6380 SESSION_DRIVER=redis CACHE_STORE=redis php artisan test --group=redis-session-integration
 */
#[Group('redis-session-integration')]
class RedisSessionSecurityIntegrationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('session.driver') !== 'redis') {
            config(['session.driver' => 'redis', 'cache.default' => 'redis']);
        }

        if (config('session.driver') !== 'redis') {
            $this->markTestSkipped('SESSION_DRIVER is not redis');
        }

        try {
            Redis::connection(config('session.connection'))->ping();
        } catch (\Throwable $exception) {
            $this->markTestSkipped('Redis unreachable: '.$exception->getMessage());
        }

        $this->app->forgetInstance('session');
        $this->app->forgetInstance('session.store');

        $this->seed(RoleSeeder::class);
    }

    #[Test]
    public function revoking_remote_session_returns_unauthorized_on_redis_backend(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502020201',
            'password' => 'Password123!',
        ]);

        $loginA = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502020201',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionCookieName = (string) config('session.cookie');
        $cookieA = $this->extractCookieValue($loginA, $sessionCookieName);
        $this->assertNotNull($cookieA);

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502020201',
            'password' => 'Password123!',
        ])->assertOk();

        $payload = $this->getStatefulJson('/api/v1/profile/security/sessions')->json();
        $other = collect(
            collect($payload['data']['devices'] ?? [])
                ->flatMap(fn (array $device): array => $device['sessions'] ?? [])
                ->all(),
        )->firstWhere('is_current', false);
        $this->assertNotNull($other);

        $this->deleteStatefulJson('/api/v1/profile/security/sessions/'.$other['id'])
            ->assertOk();

        $this->assertRevokedSessionCannotAuthenticate($sessionCookieName, $cookieA);
    }

    #[Test]
    public function logout_others_keeps_current_authenticated_on_redis_backend(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502020202',
            'password' => 'Password123!',
        ]);

        $loginA = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502020202',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionCookieName = (string) config('session.cookie');
        $cookieA = $this->extractCookieValue($loginA, $sessionCookieName);

        $this->resetStatefulSession();

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502020202',
            'password' => 'Password123!',
        ])->assertOk();

        $this->postStatefulJson('/api/v1/profile/security/sessions/logout-others')
            ->assertOk()
            ->assertJsonPath('data.revoked_count', 1);

        $this->getStatefulJson('/api/v1/auth/me')->assertOk();
        $this->assertRevokedSessionCannotAuthenticate($sessionCookieName, (string) $cookieA);
    }

    #[Test]
    public function session_registry_uses_lookup_hash_and_encrypted_storage(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502020203',
            'password' => 'Password123!',
        ]);

        $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502020203',
            'password' => 'Password123!',
        ])->assertOk();

        $row = UserSession::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertNotEmpty($row->session_lookup_hash);
        $this->assertSame(64, strlen($row->session_lookup_hash));

        $raw = (string) \DB::table('user_sessions')->where('id', $row->id)->value('laravel_session_id');
        $this->assertStringStartsWith('eyJpdiI6', $raw);
    }

    private function extractCookieValue(\Illuminate\Testing\TestResponse $response, string $name): ?string
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie->getValue();
            }
        }

        return null;
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
