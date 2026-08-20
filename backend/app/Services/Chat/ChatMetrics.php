<?php

namespace App\Services\Chat;

use Illuminate\Support\Facades\Log;

final class ChatMetrics
{
    /**
     * @param  array<string, mixed>  $context
     */
    public static function info(string $event, array $context = []): void
    {
        Log::info($event, array_merge([
            'domain' => 'chat',
            'recorded_at' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function warning(string $event, array $context = []): void
    {
        Log::warning($event, array_merge([
            'domain' => 'chat',
            'recorded_at' => now()->toIso8601String(),
        ], $context));
    }

    public static function durationMs(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }
}
