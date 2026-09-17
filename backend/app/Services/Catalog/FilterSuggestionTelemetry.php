<?php

namespace App\Services\Catalog;

use Illuminate\Support\Facades\Log;
use Throwable;

final class FilterSuggestionTelemetry
{
    /**
     * @param  array<string, mixed>  $metrics
     */
    public function record(array $metrics): void
    {
        if (! (bool) config('diyar.catalog.filter_suggestions.telemetry_enabled', true)) {
            return;
        }

        try {
            $durationMs = (int) ($metrics['duration_ms'] ?? 0);
            $enriched = array_merge([
                'smart_filter_requests_total' => 1,
                'latency_bucket' => FilterSuggestionMetrics::latencyBucket($durationMs),
            ], $metrics);

            if (($metrics['cache_hit'] ?? false) === true) {
                $enriched['smart_filter_cache_hits_total'] = 1;
            } else {
                $enriched['smart_filter_cache_misses_total'] = 1;
            }

            if (($metrics['degraded'] ?? false) === true) {
                $enriched['smart_filter_degraded_total'] = 1;
                $enriched['smart_filter_fallback_total'] = 1;
            }

            FilterSuggestionMetrics::recordRequest($enriched);
            Log::info('filter_suggestion.request', array_merge([
                'event' => 'filter_suggestion_request',
            ], $enriched));
        } catch (Throwable $exception) {
            try {
                Log::warning('filter_suggestion.telemetry_failure', [
                    'message' => $exception->getMessage(),
                ]);
            } catch (Throwable) {
                // Telemetry must never break requests.
            }
        }
    }
}
