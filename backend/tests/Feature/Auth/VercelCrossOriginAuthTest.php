<?php

namespace Tests\Feature\Auth;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

/**
 * Cross-origin SPA auth (Vercel frontend → Hostinger API) regression.
 */
class VercelCrossOriginAuthTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.url' => 'https://api.example.test',
            'session.domain' => null,
            'session.secure' => true,
            'session.same_site' => 'none',
            'sanctum.stateful' => ['app.example.test', 'www.example.test'],
            'cors.paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/*'],
            'cors.allowed_origins' => ['https://app.example.test'],
            'cors.supports_credentials' => true,
        ]);
    }

    public function test_vercel_like_origin_can_bootstrap_csrf_and_login(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501111222',
            'password' => bcrypt('Password123!'),
        ]);

        $origin = 'https://app.example.test';

        $csrf = $this->withHeaders([
            'Origin' => $origin,
            'Referer' => $origin.'/',
        ])->get('/sanctum/csrf-cookie');

        $csrf->assertNoContent();

        $login = $this->withCredentials()
            ->withHeaders([
                'Origin' => $origin,
                'Referer' => $origin.'/',
                'Accept' => 'application/json',
            ])
            ->postJson('/api/v1/auth/login', [
                'method' => 'phone',
                'identifier' => '501111222',
                'password' => 'Password123!',
            ]);

        $login->assertOk()
            ->assertJsonPath('success', true);

        $me = $this->withCredentials()
            ->withHeaders([
                'Origin' => $origin,
                'Referer' => $origin.'/',
                'Accept' => 'application/json',
            ])
            ->getJson('/api/v1/auth/me');

        $me->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_foreign_origin_cannot_hijack_authenticated_session(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($user);

        $this->withHeaders([
            'Origin' => 'https://evil.example.test',
            'Referer' => 'https://evil.example.test/',
        ])->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonMissing(['data' => ['user' => ['id' => $other->id]]]);
    }
}
