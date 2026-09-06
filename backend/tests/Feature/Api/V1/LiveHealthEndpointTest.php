<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class LiveHealthEndpointTest extends TestCase
{
    public function test_live_endpoint_returns_ok_without_dependency_checks(): void
    {
        $response = $this->getJson('/api/v1/health/live');

        $response->assertOk()
            ->assertJsonPath('data.status', 'live');
    }
}
