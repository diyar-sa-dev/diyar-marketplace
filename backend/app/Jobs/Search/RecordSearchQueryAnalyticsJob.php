<?php

namespace App\Jobs\Search;

use App\Services\Search\SearchAnalyticsRecorder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

final class RecordSearchQueryAnalyticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        public readonly string $query,
        public readonly string $searchType,
        public readonly int $resultCount,
        public readonly ?string $userId,
        public readonly ?string $sessionId,
        public readonly ?string $locale,
        public readonly array $filters,
        public readonly ?int $durationMs,
    ) {
        $this->onQueue('analytics');
    }

    public function handle(SearchAnalyticsRecorder $recorder): void
    {
        $recorder->record(
            query: $this->query,
            searchType: $this->searchType,
            resultCount: $this->resultCount,
            userId: $this->userId,
            sessionId: $this->sessionId,
            locale: $this->locale,
            filters: $this->filters,
            durationMs: $this->durationMs,
        );
    }
}
