<?php

namespace App\Services\Visualization;

use App\Exceptions\Visualization\VisualizationProviderException;
use App\Models\TryInRoomJob;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class VisualizationService
{
    public function __construct(
        private readonly VisualizationProviderRegistry $registry,
        private readonly VisualizationQuota $quota,
    ) {}

    public function execute(TryInRoomJob $job): VisualizationResult
    {
        $driver = (string) config('diyar.visualization.driver', 'null');
        $aiEnabled = (bool) config('diyar.feature.ai_visualization_enabled', false);

        if ($driver !== 'stub' && ! $aiEnabled) {
            return VisualizationResult::failed('ai_visualization_disabled');
        }

        if ($this->circuitOpen($driver)) {
            return VisualizationResult::failed('provider_circuit_open', $driver);
        }

        try {
            $provider = $this->registry->resolve($driver);
        } catch (Throwable) {
            return VisualizationResult::failed('provider_configuration_invalid');
        }

        if (! $provider->supports(VisualizationCapability::TryInRoomComposite)) {
            return VisualizationResult::failed('capability_unsupported', $provider->key());
        }

        if (! $this->quota->tryConsume((int) $job->user_id)) {
            return VisualizationResult::failed('quota_exhausted', $provider->key());
        }

        $timeoutSeconds = max(1, (int) config('diyar.visualization.timeout_seconds', 120));
        $started = microtime(true);

        try {
            $payload = $provider->process($job);
            if ((microtime(true) - $started) > $timeoutSeconds) {
                $this->recordProviderFailure($driver);

                return VisualizationResult::failed('provider_timeout', $provider->key());
            }

            if (! is_array($payload)) {
                $this->recordProviderFailure($driver);

                return VisualizationResult::failed('provider_malformed_response', $provider->key());
            }

            $this->resetProviderFailures($driver);

            return VisualizationResult::succeeded($payload, $provider->key());
        } catch (VisualizationProviderException $exception) {
            $this->recordProviderFailure($driver);

            return VisualizationResult::failed($exception->failureCode, $provider->key());
        } catch (Throwable $exception) {
            Log::info('visualization.provider_error', [
                'job_id' => $job->id,
                'user_id' => $job->user_id,
                'provider' => $provider->key(),
                'error' => $exception->getMessage(),
            ]);
            $this->recordProviderFailure($driver);

            return VisualizationResult::failed('processing_failed', $provider->key());
        }
    }

    private function circuitOpen(string $driver): bool
    {
        $threshold = (int) config('diyar.visualization.circuit_breaker_failures', 5);
        $cooldown = (int) config('diyar.visualization.circuit_breaker_seconds', 300);
        if ($threshold <= 0 || $cooldown <= 0) {
            return false;
        }

        $failures = (int) Cache::get($this->failureKey($driver), 0);

        return $failures >= $threshold;
    }

    private function recordProviderFailure(string $driver): void
    {
        $threshold = (int) config('diyar.visualization.circuit_breaker_failures', 5);
        $cooldown = (int) config('diyar.visualization.circuit_breaker_seconds', 300);
        if ($threshold <= 0 || $cooldown <= 0) {
            return;
        }

        $key = $this->failureKey($driver);
        $count = (int) Cache::get($key, 0);
        Cache::put($key, $count + 1, $cooldown);
    }

    private function resetProviderFailures(string $driver): void
    {
        Cache::forget($this->failureKey($driver));
    }

    private function failureKey(string $driver): string
    {
        return 'viz:circuit:'.$driver;
    }
}
