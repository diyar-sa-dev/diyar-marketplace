<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_returns_success_envelope(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'status',
                    'service',
                    'version',
                    'stage',
                    'environment',
                    'timestamp',
                    'checks' => [
                        'database' => ['ok', 'driver'],
                        'cache' => ['ok', 'driver'],
                        'queue' => ['ok', 'driver'],
                    ],
                    'maintenance' => [
                        'marketplace_enabled',
                        'message_ar',
                        'message_en',
                    ],
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'ok',
                    'service' => 'diyar-api',
                    'checks' => [
                        'database' => ['ok' => true],
                        'cache' => ['ok' => true],
                    ],
                ],
            ]);
    }

    public function test_health_endpoint_hides_environment_in_production(): void
    {
        app()->detectEnvironment(fn () => 'production');

        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonMissingPath('data.environment');
    }

    public function test_health_endpoint_includes_security_headers(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Permissions-Policy');
    }

    public function test_unknown_api_route_returns_json_not_found(): void
    {
        $response = $this->getJson('/api/v1/unknown-route');

        $response
            ->assertNotFound()
            ->assertJson([
                'success' => false,
                'message' => 'Resource not found.',
            ]);
    }
}
