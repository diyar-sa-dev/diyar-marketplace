<?php

namespace Tests\Unit\Services\Visualization;

use App\Contracts\Visualization\VisualizationProviderInterface;
use App\Exceptions\Visualization\VisualizationProviderException;
use App\Models\TryInRoomJob;
use App\Models\User;
use App\Services\Visualization\VisualizationCapability;
use App\Services\Visualization\VisualizationProviderRegistry;
use App\Services\Visualization\VisualizationQuota;
use App\Services\Visualization\VisualizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualizationServiceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function null_driver_fails_when_ai_disabled(): void
    {
        config([
            'diyar.visualization.driver' => 'null',
            'diyar.feature.ai_visualization_enabled' => false,
        ]);

        $job = $this->sampleJob();
        $result = app(VisualizationService::class)->execute($job);

        $this->assertFalse($result->success);
        $this->assertSame('ai_visualization_disabled', $result->failureCode);
    }

    #[Test]
    public function stub_driver_succeeds_when_ai_disabled(): void
    {
        config([
            'diyar.visualization.driver' => 'stub',
            'diyar.feature.ai_visualization_enabled' => false,
            'diyar.visualization.quota_per_user_per_day' => 100,
        ]);

        $job = $this->sampleJob();
        $result = app(VisualizationService::class)->execute($job);

        $this->assertTrue($result->success);
        $this->assertSame('stub', $result->providerKey);
        $this->assertSame('stub', $result->payload['kind'] ?? null);
    }

    #[Test]
    public function quota_exhaustion_returns_failure(): void
    {
        config([
            'diyar.visualization.driver' => 'stub',
            'diyar.visualization.quota_per_user_per_day' => 1,
        ]);

        $job = $this->sampleJob();
        $service = app(VisualizationService::class);
        $this->assertTrue($service->execute($job)->success);

        $second = $this->sampleJob();
        $result = $service->execute($second);
        $this->assertFalse($result->success);
        $this->assertSame('quota_exhausted', $result->failureCode);
    }

    #[Test]
    public function unsupported_capability_returns_failure(): void
    {
        $provider = new class implements VisualizationProviderInterface
        {
            public function key(): string
            {
                return 'fake';
            }

            public function supports(VisualizationCapability $capability): bool
            {
                return false;
            }

            public function process(TryInRoomJob $job): array
            {
                return [];
            }
        };

        $registry = \Mockery::mock(VisualizationProviderRegistry::class);
        $registry->shouldReceive('resolve')->andReturn($provider);
        $this->forgetVisualizationContainerInstances();
        $this->app->instance(VisualizationProviderRegistry::class, $registry);

        config(['diyar.visualization.driver' => 'stub', 'diyar.feature.ai_visualization_enabled' => true]);

        $result = app(VisualizationService::class)->execute($this->sampleJob());
        $this->assertFalse($result->success);
        $this->assertSame('capability_unsupported', $result->failureCode);
    }

    #[Test]
    public function provider_exception_maps_to_failure_code(): void
    {
        $provider = new class implements VisualizationProviderInterface
        {
            public function key(): string
            {
                return 'null';
            }

            public function supports(VisualizationCapability $capability): bool
            {
                return true;
            }

            public function process(TryInRoomJob $job): array
            {
                throw new VisualizationProviderException('provider_unavailable');
            }
        };

        $registry = \Mockery::mock(VisualizationProviderRegistry::class);
        $registry->shouldReceive('resolve')->andReturn($provider);
        $this->forgetVisualizationContainerInstances();
        $this->app->instance(VisualizationProviderRegistry::class, $registry);

        config(['diyar.visualization.driver' => 'null', 'diyar.feature.ai_visualization_enabled' => true]);

        $result = app(VisualizationService::class)->execute($this->sampleJob());
        $this->assertFalse($result->success);
        $this->assertSame('provider_unavailable', $result->failureCode);
    }

    #[Test]
    public function concurrent_quota_consumption_is_bounded(): void
    {
        Cache::flush();
        config(['diyar.visualization.quota_per_user_per_day' => 2]);

        $quota = app(VisualizationQuota::class);
        $userId = 4242;

        $this->assertTrue($quota->tryConsume($userId));
        $this->assertTrue($quota->tryConsume($userId));
        $this->assertFalse($quota->tryConsume($userId));
    }

    #[Test]
    public function circuit_open_skips_provider_resolution(): void
    {
        Cache::flush();
        config([
            'diyar.visualization.driver' => 'stub',
            'diyar.feature.ai_visualization_enabled' => true,
            'diyar.visualization.circuit_breaker_failures' => 1,
            'diyar.visualization.circuit_breaker_seconds' => 300,
        ]);

        Cache::put('viz:circuit:stub', 1, 300);

        $registry = \Mockery::mock(VisualizationProviderRegistry::class);
        $registry->shouldReceive('resolve')->never();
        $this->app->forgetInstance(VisualizationService::class);
        $this->app->forgetInstance(VisualizationProviderRegistry::class);
        $this->app->instance(VisualizationProviderRegistry::class, $registry);

        $result = app(VisualizationService::class)->execute($this->sampleJob());
        $this->assertFalse($result->success);
        $this->assertSame('provider_circuit_open', $result->failureCode);
    }

    #[Test]
    public function unknown_driver_returns_configuration_failure(): void
    {
        config([
            'diyar.visualization.driver' => 'not-a-real-driver',
            'diyar.feature.ai_visualization_enabled' => true,
        ]);

        $result = app(VisualizationService::class)->execute($this->sampleJob());
        $this->assertFalse($result->success);
        $this->assertSame('provider_configuration_invalid', $result->failureCode);
    }

    #[Test]
    public function circuit_breaker_blocks_after_threshold_failures(): void
    {
        Cache::flush();
        Cache::flush();
        config([
            'diyar.feature.ai_visualization_enabled' => true,
            'diyar.visualization.circuit_breaker_failures' => 2,
            'diyar.visualization.circuit_breaker_seconds' => 300,
            'diyar.visualization.quota_per_user_per_day' => 0,
        ]);

        $job = $this->sampleJob();

        $provider = new class implements VisualizationProviderInterface
        {
            public function key(): string
            {
                return 'flaky';
            }

            public function supports(VisualizationCapability $capability): bool
            {
                return true;
            }

            public function process(TryInRoomJob $job): array
            {
                throw new VisualizationProviderException('processing_failed');
            }
        };

        $registry = \Mockery::mock(VisualizationProviderRegistry::class);
        $registry->shouldReceive('resolve')->andReturn($provider);
        $this->forgetVisualizationContainerInstances();
        $this->app->instance(VisualizationProviderRegistry::class, $registry);
        config(['diyar.visualization.driver' => 'flaky']);

        $service = app(VisualizationService::class);
        $this->assertFalse($service->execute($job)->success);
        $this->assertFalse($service->execute($job)->success);

        $blocked = $service->execute($job);
        $this->assertFalse($blocked->success);
        $this->assertSame('provider_circuit_open', $blocked->failureCode);
    }

    private function sampleJob(): TryInRoomJob
    {
        $user = User::factory()->create();

        return new TryInRoomJob([
            'user_id' => $user->id,
            'product_id' => null,
            'room_design_id' => null,
        ]);
    }

    private function forgetVisualizationContainerInstances(): void
    {
        $this->app->forgetInstance(VisualizationService::class);
        $this->app->forgetInstance(VisualizationProviderRegistry::class);
    }
}
