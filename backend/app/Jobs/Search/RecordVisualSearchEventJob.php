<?php

namespace App\Jobs\Search;

use App\Models\VisualSearchEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

final class RecordVisualSearchEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $searchId,
        public readonly string $queryFingerprint,
        public readonly int $resultCount,
        public readonly ?string $userId = null,
        public readonly ?string $sessionKey = null,
    ) {}

    public function handle(): void
    {
        if (! Schema::hasTable('visual_search_events')) {
            return;
        }

        try {
            VisualSearchEvent::query()->firstOrCreate(
                [
                    'search_id' => $this->searchId,
                    'event_type' => 'search',
                ],
                [
                    'occurred_at' => now(),
                    'query_fingerprint' => $this->queryFingerprint,
                    'product_id' => null,
                    'rank_position' => null,
                    'similarity_score' => null,
                    'engine_version' => (string) config('diyar.visual_search.engine_version', 'perceptual-v1'),
                    'representation_version' => (string) config('diyar.visual_search.representation_version', 'dhash-64-v1'),
                    'ranking_version' => (string) config('diyar.visual_search.ranking_version', 'ranking-v1'),
                    'index_version' => (string) config('diyar.visual_search.index_version', 'catalog-v1'),
                    'user_id' => $this->userId,
                    'session_key' => $this->sessionKey ? Str::limit($this->sessionKey, 64, '') : null,
                    'metadata' => ['result_count' => max(0, $this->resultCount)],
                ],
            );
        } catch (Throwable $exception) {
            Log::warning('visual_search.event.record_failed', [
                'search_id' => $this->searchId,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
