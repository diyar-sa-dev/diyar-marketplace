<?php

namespace App\Services\Search;

use App\Jobs\Search\RecordSearchQueryAnalyticsJob;
use App\Models\SearchQueryEvent;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class SearchAnalyticsRecorder
{
    public function isEnabled(): bool
    {
        return (bool) config('diyar.feature.search_analytics_enabled', true);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function record(
        string $query,
        string $searchType,
        int $resultCount,
        ?string $userId = null,
        ?string $sessionId = null,
        ?string $locale = null,
        array $filters = [],
        ?int $durationMs = null,
    ): void {
        if (! $this->isEnabled()) {
            return;
        }

        $normalized = $this->normalizeQuery($query);
        if ($normalized === '') {
            return;
        }

        $measure = (bool) config('diyar.diagnostics.kvm2_measure_search_analytics_sync', false);
        $started = $measure ? hrtime(true) : null;

        try {
            SearchQueryEvent::query()->create([
                'query' => Str::limit(trim($query), 120, ''),
                'normalized_query' => $normalized,
                'search_type' => $searchType,
                'result_count' => max(0, min(65535, $resultCount)),
                'user_id' => $userId,
                'session_id' => $sessionId ? Str::limit($sessionId, 64, '') : null,
                'locale' => $locale ? Str::limit($locale, 8, '') : null,
                'source' => 'api',
                'filters' => $filters !== [] ? $filters : null,
                'duration_ms' => $durationMs,
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('search.analytics.record_failed', [
                'message' => $exception->getMessage(),
                'query' => $normalized,
            ]);
        } finally {
            if ($measure && $started !== null) {
                $ms = (hrtime(true) - $started) / 1_000_000;
                $line = json_encode([
                    'ts' => now()->toIso8601String(),
                    'analytics_record_ms' => round($ms, 3),
                    'path' => 'sync',
                ], JSON_THROW_ON_ERROR);
                @file_put_contents(storage_path('logs/kvm2-search-analytics-sync.jsonl'), $line.PHP_EOL, FILE_APPEND | LOCK_EX);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function dispatchSearchQueryEvent(
        string $query,
        string $searchType,
        int $resultCount,
        ?string $userId,
        ?string $sessionId,
        ?string $locale,
        array $filters,
        ?int $durationMs,
    ): void {
        if (! $this->isEnabled()) {
            return;
        }

        if ($this->normalizeQuery($query) === '') {
            return;
        }

        RecordSearchQueryAnalyticsJob::dispatch(
            query: $query,
            searchType: $searchType,
            resultCount: $resultCount,
            userId: $userId,
            sessionId: $sessionId,
            locale: $locale,
            filters: $filters,
            durationMs: $durationMs,
        );
    }

    public function normalizeQuery(string $query): string
    {
        $normalized = preg_replace('/\s+/u', ' ', mb_strtolower(trim($query))) ?? '';

        return Str::limit($normalized, 120, '');
    }

    public function countResults(array $payload): int
    {
        $total = 0;

        if (isset($payload['products']['pagination']['total'])) {
            $total += (int) $payload['products']['pagination']['total'];
        }

        if (isset($payload['services']['pagination']['total'])) {
            $total += (int) $payload['services']['pagination']['total'];
        }

        return $total;
    }
}
