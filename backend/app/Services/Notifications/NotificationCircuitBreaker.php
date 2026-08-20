<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Cache;

final class NotificationCircuitBreaker
{
    public function isOpen(string $provider): bool
    {
        return Cache::get($this->stateKey($provider)) === 'open';
    }

    public function recordSuccess(string $provider): void
    {
        Cache::forget($this->stateKey($provider));
        Cache::forget($this->failuresKey($provider));
    }

    public function recordFailure(string $provider): void
    {
        $failures = (int) Cache::increment($this->failuresKey($provider));
        $threshold = (int) config('diyar.notifications.circuit_breaker.failure_threshold', 5);

        if ($failures >= $threshold) {
            $cooldown = (int) config('diyar.notifications.circuit_breaker.cooldown_seconds', 120);
            Cache::put($this->stateKey($provider), 'open', $cooldown);
        }
    }

    private function stateKey(string $provider): string
    {
        return "notifications:circuit:{$provider}:state";
    }

    private function failuresKey(string $provider): string
    {
        return "notifications:circuit:{$provider}:failures";
    }
}
