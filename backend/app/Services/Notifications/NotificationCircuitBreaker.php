<?php

namespace App\Services\Notifications;

use App\Enums\NotificationFailureCategory;
use App\Infrastructure\Notifications\PushProviderException;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Throwable;

final class NotificationCircuitBreaker
{
    private const STATE_CLOSED = 'closed';

    private const STATE_OPEN = 'open';

    private const STATE_HALF_OPEN = 'half_open';

    public function assertAvailable(string $provider): void
    {
        $state = $this->resolveState($provider);

        if ($state === self::STATE_OPEN) {
            throw new RuntimeException("Notification provider [{$provider}] circuit is open.");
        }
    }

    public function isOpen(string $provider): bool
    {
        return $this->resolveState($provider) === self::STATE_OPEN;
    }

    public function isHalfOpen(string $provider): bool
    {
        return $this->resolveState($provider) === self::STATE_HALF_OPEN;
    }

    public function recordSuccess(string $provider): void
    {
        Cache::forget($this->stateKey($provider));
        Cache::forget($this->failuresKey($provider));
        Cache::forget($this->openedAtKey($provider));
    }

    public function recordFailure(string $provider): void
    {
        $state = $this->resolveState($provider);

        if ($state === self::STATE_HALF_OPEN) {
            $this->openCircuit($provider);

            return;
        }

        $failures = (int) Cache::increment($this->failuresKey($provider));
        $threshold = (int) config('diyar.notifications.circuit_breaker.failure_threshold', 5);

        if ($failures >= $threshold) {
            $this->openCircuit($provider);
        }
    }

    public function classifyFailure(Throwable $exception): NotificationFailureCategory
    {
        if ($exception instanceof PushProviderException) {
            return $exception->permanent
                ? NotificationFailureCategory::Permanent
                : NotificationFailureCategory::ProviderUnavailable;
        }

        $message = strtolower($exception->getMessage());

        if (str_contains($message, 'circuit') && str_contains($message, 'open')) {
            return NotificationFailureCategory::CircuitOpen;
        }

        if (str_contains($message, '429') || str_contains($message, 'rate limit')) {
            return NotificationFailureCategory::RateLimited;
        }

        if (str_contains($message, 'timeout') || str_contains($message, 'timed out')) {
            return NotificationFailureCategory::Timeout;
        }

        if (str_contains($message, 'no email')
            || str_contains($message, 'invalid recipient')
            || str_contains($message, 'no active push')) {
            return NotificationFailureCategory::InvalidRecipient;
        }

        if (str_contains($message, 'not configured')
            || str_contains($message, 'credentials')
            || str_contains($message, 'authentication')) {
            return NotificationFailureCategory::AuthenticationFailure;
        }

        if (str_contains($message, 'disabled')) {
            return NotificationFailureCategory::Permanent;
        }

        return NotificationFailureCategory::Unknown;
    }

    private function resolveState(string $provider): string
    {
        $state = Cache::get($this->stateKey($provider), self::STATE_CLOSED);

        if ($state !== self::STATE_OPEN) {
            return is_string($state) ? $state : self::STATE_CLOSED;
        }

        $openedAt = Cache::get($this->openedAtKey($provider));
        $cooldown = (int) config('diyar.notifications.circuit_breaker.cooldown_seconds', 120);

        if ($openedAt !== null) {
            $opened = $openedAt instanceof \DateTimeInterface ? $openedAt : now();
            if (now()->diffInSeconds($opened) >= $cooldown) {
                Cache::put($this->stateKey($provider), self::STATE_HALF_OPEN, $cooldown);

                return self::STATE_HALF_OPEN;
            }
        }

        return self::STATE_OPEN;
    }

    private function openCircuit(string $provider): void
    {
        $cooldown = (int) config('diyar.notifications.circuit_breaker.cooldown_seconds', 120);
        Cache::put($this->stateKey($provider), self::STATE_OPEN, $cooldown * 2);
        Cache::put($this->openedAtKey($provider), now(), $cooldown * 2);
    }

    private function stateKey(string $provider): string
    {
        return "diyar:circuit:{$provider}:state";
    }

    private function failuresKey(string $provider): string
    {
        return "diyar:circuit:{$provider}:failures";
    }

    private function openedAtKey(string $provider): string
    {
        return "diyar:circuit:{$provider}:opened_at";
    }
}
