<?php

namespace Tests\Unit\Services\Visualization;

use App\Models\TryInRoomJob;
use App\Models\User;
use App\Services\Visualization\Providers\NullVisualizationProvider;
use App\Services\Visualization\Providers\StubVisualizationProvider;
use App\Services\Visualization\VisualizationCapability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualizationProvidersTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function null_provider_does_not_support_try_in_room_composite(): void
    {
        $provider = new NullVisualizationProvider;
        $this->assertFalse($provider->supports(VisualizationCapability::TryInRoomComposite));
    }

    #[Test]
    public function stub_provider_returns_deterministic_stub_payload(): void
    {
        config(['diyar.try_in_room.stub_force_failure' => false]);

        $user = User::factory()->create();
        $job = new TryInRoomJob(['user_id' => $user->id, 'product_id' => null]);

        $payload = (new StubVisualizationProvider)->process($job);
        $this->assertSame('stub', $payload['kind']);
        $this->assertSame('stub', $payload['provider']);
    }
}
