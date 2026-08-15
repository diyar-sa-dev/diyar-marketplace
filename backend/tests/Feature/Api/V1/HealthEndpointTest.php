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
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'ok',
                    'service' => 'diyar-api',
                ],
            ]);
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
