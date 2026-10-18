<?php

declare(strict_types=1);

namespace Tests\Feature\Infrastructure;

use Tests\TestCase;

/**
 * Validates trusted proxy boundary between reverse proxy and Laravel Octane/FPM.
 * Untrusted direct clients cannot spoof effective client IP or protocol.
 * Trusted reverse-proxy hops correctly propagate verified client IP and HTTPS.
 */
class CloudflareTrustedProxyIngressTest extends TestCase
{
    public function test_untrusted_direct_client_cannot_spoof_client_ip_via_headers(): void
    {
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.55',
            'HTTPS' => 'off',
        ])->withHeaders([
            'CF-Connecting-IP' => '203.0.113.99',
            'X-Forwarded-For' => '203.0.113.99',
            'X-Forwarded-Proto' => 'https',
            'Accept' => 'application/json',
        ])->getJson('/api/v1/health/live');

        $response->assertOk();

        // When not behind a trusted proxy, Laravel ignores X-Forwarded-* and CF-*
        $this->assertSame('198.51.100.55', request()->ip());
        $this->assertFalse(request()->isSecure());
    }

    public function test_trusted_proxy_hop_propagates_verified_client_ip_and_https(): void
    {
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '172.18.0.5', // Docker bridge IP inside 172.16.0.0/12 trusted range
            'HTTPS' => 'off',
        ])->withHeaders([
            'X-Forwarded-For' => '203.0.113.88',
            'X-Forwarded-Proto' => 'https',
            'Accept' => 'application/json',
        ])->getJson('/api/v1/health/live');

        $response->assertOk();

        // Behind trusted proxy hop, Laravel correctly unwraps client IP and secure scheme
        $this->assertSame('203.0.113.88', request()->ip());
        $this->assertTrue(request()->isSecure());
    }
}
