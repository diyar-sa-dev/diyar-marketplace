<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatefulOriginHealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_with_vercel_spa_origin_returns_ok(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app', 'localhost:3000'],
            'session.same_site' => 'none',
            'session.secure' => true,
            'session.domain' => null,
        ]);

        $this->withHeader('Origin', 'https://diyar-psi.vercel.app')
            ->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_health_with_vercel_spa_origin_and_legacy_session_domain_returns_ok(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app'],
            'session.same_site' => 'none',
            'session.secure' => true,
            'session.domain' => '.diyar.sa',
        ]);

        $this->withHeader('Origin', 'https://diyar-psi.vercel.app')
            ->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_health_with_vercel_session_domain_and_render_host_returns_ok(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app'],
            'session.same_site' => 'none',
            'session.secure' => true,
            'session.domain' => 'diyar-psi.vercel.app',
        ]);

        $this->withHeader('Origin', 'https://diyar-psi.vercel.app')
            ->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_health_with_forwarded_host_and_spa_origin_returns_ok(): void
    {
        config([
            'sanctum.stateful' => ['diyar-psi.vercel.app'],
            'session.same_site' => 'none',
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
}
