<?php

declare(strict_types=1);

namespace Tests\Feature\Infrastructure;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * Ensures spoofed X-Forwarded-For from untrusted clients cannot bypass rate limits.
 */
class TrustedProxyRateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['diyar.loadtest.enabled' => false]);
        config(['diyar.rate_limits.catalog_search_per_minute' => 3]);

        RateLimiter::clear('catalog-search');
    }

    public function test_rotating_spoofed_xff_cannot_bypass_catalog_search_limiter(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.50'])
                ->withHeaders([
                    'X-Forwarded-For' => '198.51.100.'.($i + 1),
                    'Accept' => 'application/json',
                ])
                ->getJson('/api/v1/catalog/search?q=proxy-probe-'.$i.'&type=products')
                ->assertOk();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.50'])
            ->withHeaders([
                'X-Forwarded-For' => '198.51.100.99',
                'Accept' => 'application/json',
            ])
            ->getJson('/api/v1/catalog/search?q=proxy-probe-final&type=products')
            ->assertStatus(429);
    }
}
