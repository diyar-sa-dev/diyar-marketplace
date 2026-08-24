<?php

namespace Tests\Feature\Api\V1;

use App\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class StatefulOriginHealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_with_vercel_spa_origin_and_render_host_returns_ok(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app'],
            'session.same_site' => 'none',
            'session.secure' => true,
            'session.domain' => null,
        ]);

        $this->withHeader('Origin', 'https://diyar-psi.vercel.app')
            ->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_cross_origin_stateful_domain_is_allowed_on_render_host(): void
    {
        config(['sanctum.stateful' => ['diyar-psi.vercel.app']]);

        $request = Request::create(
            'https://diyar-k255.onrender.com/api/v1/auth/login',
            'POST',
            server: [
                'HTTP_HOST' => 'diyar-k255.onrender.com',
                'HTTP_ORIGIN' => 'https://diyar-psi.vercel.app',
            ],
        );

        $this->assertTrue(EnsureFrontendRequestsAreStateful::originIsSanctumStatefulDomain($request));
        $this->assertFalse(EnsureFrontendRequestsAreStateful::originMatchesApplicationHost($request));
    }

    public function test_health_with_forwarded_host_and_matching_origin_is_stateful(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app'],
            'session.same_site' => 'lax',
            'session.secure' => true,
            'session.domain' => null,
        ]);

        $this->withHeaders([
            'Origin' => 'https://diyar-psi.vercel.app',
            'X-Forwarded-Host' => 'diyar-psi.vercel.app',
            'X-Forwarded-Proto' => 'https',
        ])->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_csrf_token_with_forwarded_host_and_matching_origin_returns_token(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app'],
            'session.same_site' => 'lax',
            'session.secure' => true,
            'session.domain' => null,
        ]);

        $response = $this->withHeaders([
            'Origin' => 'https://diyar-psi.vercel.app',
            'X-Forwarded-Host' => 'diyar-psi.vercel.app',
            'X-Forwarded-Proto' => 'https',
        ])->getJson('/api/v1/csrf-token');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_origin_host_matching_helper(): void
    {
        $request = Request::create(
            'https://diyar-psi.vercel.app/api/v1/health',
            'GET',
            server: ['HTTP_HOST' => 'diyar-psi.vercel.app', 'HTTP_ORIGIN' => 'https://diyar-psi.vercel.app'],
        );

        $this->assertTrue(EnsureFrontendRequestsAreStateful::originMatchesApplicationHost($request));

        $mismatch = Request::create(
            'https://diyar-k255.onrender.com/api/v1/health',
            'GET',
            server: ['HTTP_HOST' => 'diyar-k255.onrender.com', 'HTTP_ORIGIN' => 'https://diyar-psi.vercel.app'],
        );

        $this->assertFalse(EnsureFrontendRequestsAreStateful::originMatchesApplicationHost($mismatch));
    }
}
