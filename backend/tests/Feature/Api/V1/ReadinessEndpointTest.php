<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadinessEndpointTest extends TestCase
{
    use RefreshDatabase;
    public function test_readiness_endpoint_returns_queue_probe(): void
    {
        $response = $this->getJson('/api/v1/readiness');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'status',
                    'checks' => [
                        'database' => ['ok', 'driver'],
                        'cache' => ['ok', 'driver'],
                        'queue' => ['ok', 'driver'],
                    ],
                ],
            ]);
    }

    public function test_readiness_includes_request_correlation_header(): void
    {
        $response = $this->getJson('/api/v1/readiness', [
            'X-Request-Id' => 'test-correlation-id',
        ]);

        $response
            ->assertOk()
            ->assertHeader('X-Request-Id', 'test-correlation-id');
    }
}
