<?php

namespace Tests\Unit\Services\SpatialLayout;

use App\Domains\RoomDesigner\Services\Providers\StubSpatialLayoutProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class StubSpatialLayoutProviderTest extends TestCase
{
    #[Test]
    public function it_suggests_move_commands_for_unlocked_items(): void
    {
        $provider = new StubSpatialLayoutProvider;
        $document = [
            'schema_version' => 1,
            'room' => ['width_m' => 4, 'depth_m' => 4, 'origin' => 'corner'],
            'items' => [
                ['id' => 'a', 'locked' => false, 'position_m' => ['x' => 0, 'z' => 0]],
                ['id' => 'b', 'locked' => true, 'position_m' => ['x' => 1, 'z' => 1]],
            ],
        ];

        $commands = $provider->suggest($document, 'arrange');

        $this->assertCount(1, $commands);
        $this->assertSame('MOVE', $commands[0]['type']);
        $this->assertSame('a', $commands[0]['itemId']);
    }
}
