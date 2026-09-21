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
    public function registry_resolves_openai_driver(): void
    {
        config(['diyar.visualization.driver' => 'openai']);

        $provider = app(\App\Services\Visualization\VisualizationProviderRegistry::class)->resolve('openai');
        $this->assertSame('openai', $provider->key());
    }

    #[Test]
    public function stub_provider_returns_composite_image_payload(): void
    {
        config(['diyar.try_in_room.stub_force_failure' => false]);
        \Illuminate\Support\Facades\Storage::fake('try_in_room');

        $user = User::factory()->create();
        $job = new TryInRoomJob(['user_id' => $user->id, 'product_id' => null]);

        $payload = app(StubVisualizationProvider::class)->process($job);
        $this->assertSame('composite_image', $payload['kind']);
        $this->assertSame('stub', $payload['provider']);
        $this->assertNotEmpty($payload['result_path']);
        \Illuminate\Support\Facades\Storage::disk('try_in_room')->assertExists($payload['result_path']);
    }
}
