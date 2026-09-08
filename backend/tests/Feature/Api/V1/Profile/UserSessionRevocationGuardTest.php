<?php

namespace Tests\Feature\Api\V1\Profile;

use App\Enums\RoleName;
use App\Models\UserSession;
use App\Support\Security\RevokedSessionCache;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class UserSessionRevocationGuardTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    #[Test]
    public function revoked_cache_marker_blocks_authentication_even_if_handler_destroy_skipped(): void
    {
        $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501060601',
            'password' => 'Password123!',
        ]);

        $login = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501060601',
            'password' => 'Password123!',
        ])->assertOk();

        $sessionCookieName = (string) config('session.cookie');
        $cookie = $this->extractCookieValue($login, $sessionCookieName);
        $this->assertNotNull($cookie);

        $row = UserSession::query()->whereNull('revoked_at')->firstOrFail();
        RevokedSessionCache::markRevoked((string) $row->laravel_session_id);
        $row->forceFill(['revoked_at' => now(), 'ip_address' => null])->save();

        $this->app['auth']->forgetGuards();
        $this->resetStatefulSession();

        $this->withUnencryptedCookie($sessionCookieName, $cookie)
            ->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
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
}
