<?php

namespace App\Services\Catalog;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Structured Smart Filter metrics (log-based; safe for aggregation pipelines).
 */
final class FilterSuggestionMetrics
{
    /**
     * @param  array<string, mixed>  $context
     */
    public static function recordRequest(array $context): void
    {
        self::emit('smart_filter.request', $context);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function recordError(array $context): void
    {
        self::emit('smart_filter.error', $context, 'warning');
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private static function emit(string $event, array $context, string $level = 'info'): void
    {
        if (! (bool) config('diyar.catalog.filter_suggestions.telemetry_enabled', true)) {
            return;
        }

        try {
            $payload = array_merge([
                'event' => $event,
                'domain' => 'smart_filters',
                'recorded_at' => now()->toIso8601String(),
            ], $context);

            match ($level) {
                'warning' => Log::warning($event, $payload),
                default => Log::info($event, $payload),
            };
        } catch (Throwable) {
            // Metrics must never break requests.
        }
    }

    public static function latencyBucket(int $durationMs): string
    {
        return match (true) {
            $durationMs <= 20 => 'le_20ms',
            $durationMs <= 50 => 'le_50ms',
            $durationMs <= 100 => 'le_100ms',
            $durationMs <= 250 => 'le_250ms',
            $durationMs <= 500 => 'le_500ms',
            default => 'gt_500ms',
        };
    }
}
