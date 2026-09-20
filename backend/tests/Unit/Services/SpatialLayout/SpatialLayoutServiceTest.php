<?php

namespace Tests\Unit\Services\SpatialLayout;

use App\Services\SpatialLayout\SpatialLayoutService;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SpatialLayoutServiceTest extends TestCase
{
    #[Test]
    public function external_driver_blocked_when_legal_gate_closed(): void
    {
        config(['diyar.spatial_layout.driver' => 'openai']);

        $service = app(SpatialLayoutService::class);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('spatial_layout_external_blocked');

        $service->suggest([
            'schema_version' => 1,
            'room' => ['width_m' => 4, 'depth_m' => 4, 'origin' => 'corner'],
            'items' => [],
        ]);
    }

    #[Test]
    public function stub_driver_returns_commands(): void
    {
        config(['diyar.spatial_layout.driver' => 'stub']);

        $service = app(SpatialLayoutService::class);
        $result = $service->suggest([
            'schema_version' => 1,
            'room' => ['width_m' => 4, 'depth_m' => 4, 'origin' => 'corner'],
            'items' => [
                ['id' => 'x', 'locked' => false],
            ],
        ]);

        $this->assertSame('stub', $result['provider']);
        $this->assertNotEmpty($result['commands']);
    }
}
